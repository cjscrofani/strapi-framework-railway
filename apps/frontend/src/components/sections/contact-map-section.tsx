'use client';

import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6
    }
  }
};

export function ContactMapSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const officeInfo = {
    name: 'Strapi Railway Framework HQ',
    address: '123 Innovation Drive, San Francisco, CA 94105',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    directions: 'https://maps.google.com/?q=123+Innovation+Drive,+San+Francisco,+CA+94105',
    parking: 'Visitor parking available in the building garage',
    publicTransport: 'Montgomery St BART station - 5 min walk',
    nearbyLandmarks: 'Located in the Financial District, near Salesforce Tower'
  };

  const otherLocations = [
    {
      name: 'New York Office',
      address: '456 Tech Avenue, New York, NY 10001',
      type: 'Satellite Office',
      contact: '+1 (555) 123-4568'
    },
    {
      name: 'Austin Office',
      address: '789 Startup Boulevard, Austin, TX 73301',
      type: 'Development Center',
      contact: '+1 (555) 123-4569'
    },
    {
      name: 'Remote Teams',
      address: 'Distributed across North America & Europe',
      type: 'Remote Operations',
      contact: 'hello@example.com'
    }
  ];

  return (
    <Section spacing="xl" className="bg-muted/30">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Visit Our Office
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Drop by our headquarters in San Francisco or connect with our distributed team worldwide.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Map Area */}
            <motion.div variants={itemVariants}>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
                {/* Map Placeholder */}
                <div className="relative h-80 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Interactive Map</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click below to open in Google Maps
                      </p>
                      <Button asChild>
                        <a
                          href={officeInfo.directions}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Maps
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Map Overlay */}
                  <div className="absolute inset-0 bg-black/5"></div>
                </div>

                {/* Office Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">{officeInfo.name}</h3>
                      <p className="text-muted-foreground">{officeInfo.address}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Parking:</span>
                      <span className="text-muted-foreground ml-2">{officeInfo.parking}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Public Transport:</span>
                      <span className="text-muted-foreground ml-2">{officeInfo.publicTransport}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Nearby:</span>
                      <span className="text-muted-foreground ml-2">{officeInfo.nearbyLandmarks}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button size="sm" asChild>
                      <a
                        href={officeInfo.directions}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/contact?type=visit">
                        Schedule Visit
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Office Information */}
            <motion.div variants={itemVariants} className="space-y-8">
              {/* Main Office Info */}
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Headquarters Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-foreground mb-1">Office Hours</div>
                      <div className="text-muted-foreground">
                        Mon-Fri: 9:00 AM - 6:00 PM<br />
                        Weekends: By appointment
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">Time Zone</div>
                      <div className="text-muted-foreground">
                        Pacific Standard Time<br />
                        (UTC-8 / UTC-7 DST)
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="font-medium text-foreground mb-2">Building Access</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Visitor check-in required at main lobby</li>
                      <li>• Photo ID required for entry</li>
                      <li>• We'll meet you in the lobby for your appointment</li>
                      <li>• ADA accessible building with elevator access</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Other Locations */}
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Other Locations
                </h3>
                
                <div className="space-y-4">
                  {otherLocations.map((location, index) => (
                    <motion.div
                      key={location.name}
                      variants={{
                        hidden: { y: 20, opacity: 0 },
                        visible: {
                          y: 0,
                          opacity: 1,
                          transition: {
                            delay: index * 0.1,
                            duration: 0.5
                          }
                        }
                      }}
                      className="border border-border/50 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-foreground">{location.name}</h4>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {location.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {location.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Contact:</strong> {location.contact}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Visit Information */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Planning a Visit?
                </h3>
                
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    We'd love to meet you in person! Here's what you need to know:
                  </p>
                  
                  <ul className="text-muted-foreground space-y-1">
                    <li>• All visits are by appointment only</li>
                    <li>• Please arrive 10 minutes early for check-in</li>
                    <li>• Complimentary coffee, tea, and snacks available</li>
                    <li>• Conference rooms equipped with latest presentation tech</li>
                    <li>• Free WiFi available for guests</li>
                  </ul>

                  <div className="pt-4">
                    <Button size="sm" className="w-full" asChild>
                      <a href="/contact?type=visit">
                        Schedule Your Visit
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}