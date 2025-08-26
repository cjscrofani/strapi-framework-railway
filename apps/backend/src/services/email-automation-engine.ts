/**
 * Email Automation Engine
 * Handles complex email workflows, triggers, and conditional branching
 */

import cron from 'node-cron';
import EmailMarketingService, { UnifiedCampaign } from './email-marketing';
import SubscriberManager, { UnifiedSubscriber } from './subscriber-manager';
import EmailTemplateBuilder from './email-template-builder';

export interface WorkflowTrigger {
  id: string;
  type: 'welcome' | 'abandoned_cart' | 'birthday' | 'tag_added' | 'custom_date' | 'api_trigger' | 'behavior' | 'purchase';
  name: string;
  description: string;
  conditions: TriggerCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowStep {
  id: string;
  type: 'email' | 'delay' | 'condition' | 'tag_action' | 'webhook' | 'split_test';
  name: string;
  config: WorkflowStepConfig;
  position: number;
  nextSteps: string[]; // IDs of next steps
  conditions?: WorkflowCondition[];
}

export interface WorkflowStepConfig {
  // Email step
  templateId?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  
  // Delay step
  delay?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  
  // Condition step
  conditionLogic?: {
    conditions: TriggerCondition[];
    trueStepId?: string;
    falseStepId?: string;
  };
  
  // Tag action step
  tagAction?: {
    action: 'add' | 'remove';
    tags: string[];
  };
  
  // Webhook step
  webhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    headers?: Record<string, string>;
    payload?: Record<string, any>;
  };
  
  // Split test step
  splitTest?: {
    percentage: number;
    variantAStepId: string;
    variantBStepId: string;
  };
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  provider: 'sendgrid' | 'mailchimp' | 'both';
  createdAt: Date;
  updatedAt: Date;
  stats: {
    triggered: number;
    completed: number;
    failed: number;
    avgCompletionTime: number;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  subscriberEmail: string;
  subscriberData: Record<string, any>;
  currentStepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  executionLog: ExecutionLogEntry[];
  scheduledAt?: Date;
}

export interface ExecutionLogEntry {
  stepId: string;
  stepName: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  timestamp: Date;
  duration?: number;
  data?: Record<string, any>;
  error?: string;
}

class EmailAutomationEngine {
  private emailMarketing: EmailMarketingService;
  private subscriberManager: SubscriberManager;
  private templateBuilder: EmailTemplateBuilder;
  private workflows: Map<string, EmailWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isProcessing = false;

  constructor(
    emailMarketing: EmailMarketingService,
    subscriberManager: SubscriberManager,
    templateBuilder: EmailTemplateBuilder
  ) {
    this.emailMarketing = emailMarketing;
    this.subscriberManager = subscriberManager;
    this.templateBuilder = templateBuilder;
    this.startExecutionProcessor();
    this.startScheduledProcessor();
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    try {
      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newWorkflow: EmailWorkflow = {
        ...workflow,
        id: workflowId,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          triggered: 0,
          completed: 0,
          failed: 0,
          avgCompletionTime: 0,
        },
      };

      // Validate workflow structure
      await this.validateWorkflow(newWorkflow);
      
      this.workflows.set(workflowId, newWorkflow);
      await this.saveWorkflow(newWorkflow);
      
      return workflowId;
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<EmailWorkflow>): Promise<boolean> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const updatedWorkflow = {
        ...workflow,
        ...updates,
        id: workflowId, // Prevent ID changes
        updatedAt: new Date(),
      };

      await this.validateWorkflow(updatedWorkflow);
      
      this.workflows.set(workflowId, updatedWorkflow);
      await this.saveWorkflow(updatedWorkflow);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Stop any running executions
      const runningExecutions = Array.from(this.executions.values())
        .filter(e => e.workflowId === workflowId && e.status === 'running');
      
      for (const execution of runningExecutions) {
        execution.status = 'failed';
        execution.error = 'Workflow deleted';
        execution.completedAt = new Date();
        await this.updateExecution(execution);
      }

      this.workflows.delete(workflowId);
      await this.deleteWorkflowFromDB(workflowId);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  // Workflow Execution
  async triggerWorkflow(
    workflowId: string,
    subscriberEmail: string,
    triggerData: Record<string, any> = {},
    delay?: { amount: number; unit: 'minutes' | 'hours' | 'days' | 'weeks' }
  ): Promise<string> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.isActive) {
        throw new Error('Workflow is not active');
      }

      // Get subscriber data
      const subscriber = await this.subscriberManager.getSubscriber(subscriberEmail);
      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      // Check trigger conditions
      if (!this.evaluateTriggerConditions(workflow.trigger, { ...subscriber, ...triggerData })) {
        throw new Error('Trigger conditions not met');
      }

      let scheduledAt = new Date();
      if (delay) {
        const multipliers = { minutes: 1, hours: 60, days: 1440, weeks: 10080 };
        const delayMinutes = delay.amount * multipliers[delay.unit];
        scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
      }

      const executionId = `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        subscriberEmail,
        subscriberData: { ...subscriber, ...triggerData },
        currentStepId: workflow.steps[0]?.id || '',
        status: scheduledAt > new Date() ? 'pending' : 'running',
        startedAt: new Date(),
        executionLog: [],
        scheduledAt: scheduledAt > new Date() ? scheduledAt : undefined,
      };

      this.executions.set(executionId, execution);
      await this.saveExecution(execution);

      // Update workflow stats
      workflow.stats.triggered += 1;
      this.workflows.set(workflowId, workflow);
      await this.updateWorkflowStats(workflowId, workflow.stats);

      // Start execution if not scheduled
      if (scheduledAt <= new Date()) {
        await this.executeWorkflowStep(execution);
      }

      return executionId;
    } catch (error) {
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }

  async pauseExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      if (execution.status !== 'running' && execution.status !== 'pending') {
        throw new Error('Cannot pause execution in current state');
      }

      execution.status = 'paused';
      this.executions.set(executionId, execution);
      await this.updateExecution(execution);

      return true;
    } catch (error) {
      throw new Error(`Failed to pause execution: ${error.message}`);
    }
  }

  async resumeExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      if (execution.status !== 'paused') {
        throw new Error('Execution is not paused');
      }

      execution.status = 'running';
      this.executions.set(executionId, execution);
      await this.updateExecution(execution);

      // Continue execution
      await this.executeWorkflowStep(execution);

      return true;
    } catch (error) {
      throw new Error(`Failed to resume execution: ${error.message}`);
    }
  }

  // Step Execution
  private async executeWorkflowStep(execution: WorkflowExecution): Promise<void> {
    try {
      const workflow = this.workflows.get(execution.workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const step = workflow.steps.find(s => s.id === execution.currentStepId);
      if (!step) {
        // Workflow completed
        execution.status = 'completed';
        execution.completedAt = new Date();
        workflow.stats.completed += 1;
        await this.updateWorkflowStats(execution.workflowId, workflow.stats);
        await this.updateExecution(execution);
        return;
      }

      const logEntry: ExecutionLogEntry = {
        stepId: step.id,
        stepName: step.name,
        status: 'started',
        timestamp: new Date(),
      };

      execution.executionLog.push(logEntry);
      await this.updateExecution(execution);

      const startTime = Date.now();

      try {
        const nextStepId = await this.executeStep(step, execution);
        
        logEntry.status = 'completed';
        logEntry.duration = Date.now() - startTime;
        
        if (nextStepId) {
          execution.currentStepId = nextStepId;
          execution.status = 'running';
          // Continue with next step
          setImmediate(() => this.executeWorkflowStep(execution));
        } else {
          // Workflow completed
          execution.status = 'completed';
          execution.completedAt = new Date();
          workflow.stats.completed += 1;
          await this.updateWorkflowStats(execution.workflowId, workflow.stats);
        }

        await this.updateExecution(execution);
      } catch (stepError) {
        logEntry.status = 'failed';
        logEntry.error = stepError.message;
        logEntry.duration = Date.now() - startTime;

        execution.status = 'failed';
        execution.error = stepError.message;
        execution.completedAt = new Date();
        
        workflow.stats.failed += 1;
        await this.updateWorkflowStats(execution.workflowId, workflow.stats);
        await this.updateExecution(execution);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      await this.updateExecution(execution);
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    switch (step.type) {
      case 'email':
        return await this.executeEmailStep(step, execution);
      
      case 'delay':
        return await this.executeDelayStep(step, execution);
      
      case 'condition':
        return await this.executeConditionStep(step, execution);
      
      case 'tag_action':
        return await this.executeTagActionStep(step, execution);
      
      case 'webhook':
        return await this.executeWebhookStep(step, execution);
      
      case 'split_test':
        return await this.executeSplitTestStep(step, execution);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeEmailStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { templateId, subject, fromName, fromEmail } = step.config;
    
    if (!templateId) {
      throw new Error('Template ID is required for email step');
    }

    // Render template with subscriber data
    const rendered = await this.templateBuilder.renderTemplate(templateId, {
      data: execution.subscriberData,
      darkMode: false, // Could be derived from subscriber preferences
    });

    // Create campaign
    const campaign: UnifiedCampaign = {
      name: `${execution.workflowId}_${step.id}_${execution.id}`,
      subject: subject || rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
      fromName: fromName || 'Your Company',
      fromEmail: fromEmail || 'noreply@yourcompany.com',
      recipients: [execution.subscriberEmail],
      provider: 'both', // Use both providers
      segmentId: undefined,
      templateId,
      scheduledAt: new Date(),
    };

    const result = await this.emailMarketing.createCampaign(campaign);
    if (!result.success) {
      throw new Error(`Failed to send email: ${result.errors?.join(', ')}`);
    }

    // Send campaign immediately
    const sendResult = await this.emailMarketing.sendCampaign(result.campaignId!, campaign.provider);
    if (!sendResult.success) {
      throw new Error(`Failed to send campaign: ${sendResult.errors?.join(', ')}`);
    }

    // Return next step
    return step.nextSteps[0] || null;
  }

  private async executeDelayStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { delay } = step.config;
    
    if (!delay) {
      throw new Error('Delay configuration is required for delay step');
    }

    const multipliers = { minutes: 1, hours: 60, days: 1440, weeks: 10080 };
    const delayMinutes = delay.amount * multipliers[delay.unit];
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Update execution to be scheduled
    execution.scheduledAt = scheduledAt;
    execution.status = 'pending';
    execution.currentStepId = step.nextSteps[0] || '';
    
    return null; // Will be processed by scheduled processor
  }

  private async executeConditionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { conditionLogic } = step.config;
    
    if (!conditionLogic) {
      throw new Error('Condition logic is required for condition step');
    }

    const conditionMet = this.evaluateConditions(conditionLogic.conditions, execution.subscriberData);
    
    return conditionMet ? 
      (conditionLogic.trueStepId || step.nextSteps[0] || null) :
      (conditionLogic.falseStepId || null);
  }

  private async executeTagActionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { tagAction } = step.config;
    
    if (!tagAction) {
      throw new Error('Tag action configuration is required for tag action step');
    }

    // Update subscriber tags
    const subscriber = await this.subscriberManager.getSubscriber(execution.subscriberEmail);
    if (subscriber) {
      const currentTags = new Set(subscriber.tags || []);
      
      if (tagAction.action === 'add') {
        tagAction.tags.forEach(tag => currentTags.add(tag));
      } else {
        tagAction.tags.forEach(tag => currentTags.delete(tag));
      }

      await this.subscriberManager.updateSubscriber(execution.subscriberEmail, {
        tags: Array.from(currentTags),
      });
    }

    return step.nextSteps[0] || null;
  }

  private async executeWebhookStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { webhook } = step.config;
    
    if (!webhook) {
      throw new Error('Webhook configuration is required for webhook step');
    }

    const payload = {
      ...webhook.payload,
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        subscriberEmail: execution.subscriberEmail,
        subscriberData: execution.subscriberData,
      },
    };

    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers,
      },
      body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    return step.nextSteps[0] || null;
  }

  private async executeSplitTestStep(step: WorkflowStep, execution: WorkflowExecution): Promise<string | null> {
    const { splitTest } = step.config;
    
    if (!splitTest) {
      throw new Error('Split test configuration is required for split test step');
    }

    // Simple random assignment based on email hash
    const emailHash = execution.subscriberEmail.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const isVariantA = Math.abs(emailHash) % 100 < splitTest.percentage;
    
    return isVariantA ? splitTest.variantAStepId : splitTest.variantBStepId;
  }

  // Condition Evaluation
  private evaluateTriggerConditions(trigger: WorkflowTrigger, data: Record<string, any>): boolean {
    return this.evaluateConditions(trigger.conditions, data);
  }

  private evaluateConditions(conditions: TriggerCondition[], data: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], data);
    
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  private evaluateCondition(condition: TriggerCondition, data: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Workflow Validation
  private async validateWorkflow(workflow: EmailWorkflow): Promise<void> {
    // Validate basic structure
    if (!workflow.name || !workflow.trigger || !workflow.steps) {
      throw new Error('Workflow must have name, trigger, and steps');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step references
    const stepIds = new Set(workflow.steps.map(s => s.id));
    
    for (const step of workflow.steps) {
      for (const nextStepId of step.nextSteps) {
        if (!stepIds.has(nextStepId)) {
          throw new Error(`Step ${step.id} references non-existent step: ${nextStepId}`);
        }
      }
    }

    // Validate email steps have templates
    for (const step of workflow.steps) {
      if (step.type === 'email' && !step.config.templateId) {
        throw new Error(`Email step ${step.id} must have a template ID`);
      }
    }
  }

  // Background Processors
  private startExecutionProcessor(): void {
    // Process pending executions every minute
    cron.schedule('* * * * *', async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        const now = new Date();
        const pendingExecutions = Array.from(this.executions.values())
          .filter(e => e.status === 'pending' && e.scheduledAt && e.scheduledAt <= now);

        for (const execution of pendingExecutions) {
          execution.status = 'running';
          execution.scheduledAt = undefined;
          await this.executeWorkflowStep(execution);
        }
      } catch (error) {
        console.error('Error in execution processor:', error);
      } finally {
        this.isProcessing = false;
      }
    });
  }

  private startScheduledProcessor(): void {
    // Clean up completed executions older than 7 days
    cron.schedule('0 2 * * *', async () => {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const expiredExecutions = Array.from(this.executions.entries())
        .filter(([id, execution]) => 
          (execution.status === 'completed' || execution.status === 'failed') && 
          execution.completedAt && 
          execution.completedAt < cutoffDate
        );

      for (const [id, execution] of expiredExecutions) {
        this.executions.delete(id);
        await this.deleteExecutionFromDB(id);
      }
    });
  }

  // Pre-built Workflow Templates
  async createWelcomeWorkflow(
    provider: 'sendgrid' | 'mailchimp' | 'both' = 'both',
    welcomeTemplateId: string
  ): Promise<string> {
    const workflow: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'> = {
      name: 'Welcome Series',
      description: 'Automated welcome email series for new subscribers',
      trigger: {
        id: 'welcome_trigger',
        type: 'welcome',
        name: 'New Subscriber',
        description: 'Triggered when someone subscribes',
        conditions: [
          {
            field: 'email',
            operator: 'exists',
            value: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      steps: [
        {
          id: 'welcome_email',
          type: 'email',
          name: 'Send Welcome Email',
          config: {
            templateId: welcomeTemplateId,
            subject: 'Welcome to Our Community!',
          },
          position: 1,
          nextSteps: ['delay_3_days'],
        },
        {
          id: 'delay_3_days',
          type: 'delay',
          name: 'Wait 3 Days',
          config: {
            delay: { amount: 3, unit: 'days' },
          },
          position: 2,
          nextSteps: ['follow_up_email'],
        },
        {
          id: 'follow_up_email',
          type: 'email',
          name: 'Send Follow-up Email',
          config: {
            templateId: welcomeTemplateId, // You'd want a different template here
            subject: 'How are you getting on?',
          },
          position: 3,
          nextSteps: [],
        },
      ],
      isActive: true,
      provider,
    };

    return await this.createWorkflow(workflow);
  }

  async createAbandonedCartWorkflow(
    provider: 'sendgrid' | 'mailchimp' | 'both' = 'both',
    cartTemplateId: string
  ): Promise<string> {
    const workflow: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'> = {
      name: 'Abandoned Cart Recovery',
      description: 'Re-engage customers who left items in their cart',
      trigger: {
        id: 'cart_trigger',
        type: 'abandoned_cart',
        name: 'Cart Abandoned',
        description: 'Triggered when cart is abandoned for 1 hour',
        conditions: [
          {
            field: 'cart_items',
            operator: 'exists',
            value: true,
          },
          {
            field: 'cart_updated_at',
            operator: 'less_than',
            value: Date.now() - 60 * 60 * 1000, // 1 hour ago
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      steps: [
        {
          id: 'reminder_email_1',
          type: 'email',
          name: 'First Reminder',
          config: {
            templateId: cartTemplateId,
            subject: 'You left something in your cart!',
          },
          position: 1,
          nextSteps: ['delay_1_day'],
        },
        {
          id: 'delay_1_day',
          type: 'delay',
          name: 'Wait 1 Day',
          config: {
            delay: { amount: 1, unit: 'days' },
          },
          position: 2,
          nextSteps: ['check_purchase'],
        },
        {
          id: 'check_purchase',
          type: 'condition',
          name: 'Check if Purchased',
          config: {
            conditionLogic: {
              conditions: [
                {
                  field: 'last_purchase_date',
                  operator: 'greater_than',
                  value: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
                },
              ],
              trueStepId: undefined, // End workflow if purchased
              falseStepId: 'reminder_email_2',
            },
          },
          position: 3,
          nextSteps: [],
        },
        {
          id: 'reminder_email_2',
          type: 'email',
          name: 'Second Reminder with Discount',
          config: {
            templateId: cartTemplateId,
            subject: 'Complete your purchase - 10% off!',
          },
          position: 4,
          nextSteps: [],
        },
      ],
      isActive: true,
      provider,
    };

    return await this.createWorkflow(workflow);
  }

  // Analytics
  async getWorkflowAnalytics(workflowId: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);

    const completedExecutions = executions.filter(e => e.status === 'completed');
    const avgCompletionTime = completedExecutions.length > 0 ?
      completedExecutions.reduce((sum, e) => {
        if (e.completedAt && e.startedAt) {
          return sum + (e.completedAt.getTime() - e.startedAt.getTime());
        }
        return sum;
      }, 0) / completedExecutions.length : 0;

    return {
      workflow: {
        id: workflow.id,
        name: workflow.name,
        isActive: workflow.isActive,
      },
      stats: {
        ...workflow.stats,
        avgCompletionTime: Math.round(avgCompletionTime / 1000 / 60), // minutes
      },
      recentExecutions: executions
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 10),
    };
  }

  // Database Operations (placeholder implementations)
  private async saveWorkflow(workflow: EmailWorkflow): Promise<void> {
    console.log('Saving workflow:', workflow.id);
  }

  private async saveExecution(execution: WorkflowExecution): Promise<void> {
    console.log('Saving execution:', execution.id);
  }

  private async updateExecution(execution: WorkflowExecution): Promise<void> {
    console.log('Updating execution:', execution.id);
  }

  private async updateWorkflowStats(workflowId: string, stats: EmailWorkflow['stats']): Promise<void> {
    console.log('Updating workflow stats:', workflowId);
  }

  private async deleteWorkflowFromDB(workflowId: string): Promise<void> {
    console.log('Deleting workflow from DB:', workflowId);
  }

  private async deleteExecutionFromDB(executionId: string): Promise<void> {
    console.log('Deleting execution from DB:', executionId);
  }

  // Cleanup
  async stop(): Promise<void> {
    for (const job of this.cronJobs.values()) {
      job.stop();
    }
    this.cronJobs.clear();
  }
}

export default EmailAutomationEngine;