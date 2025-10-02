"use client"

import { useState } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, Phone, Clock, MessageSquare, Users, Zap } from "lucide-react"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage("")

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setSubmitMessage("Thanks for your message! We'll get back to you within 24 hours.")

    // Reset form
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 py-24">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-sm font-medium">💬 We'd Love to Hear From You</span>
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Get in{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about our platform, need technical support, or want to partner with us?
              We're here to help and would love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select name="subject">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                        <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        <SelectItem value="course">Course Content</SelectItem>
                        <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      placeholder="Tell us how we can help..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>

                  {submitMessage && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-300 text-sm">{submitMessage}</p>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Us</h3>
                      <p className="text-muted-foreground mb-2">Get help via email</p>
                      <a href="mailto:support@lazygamedevs.com" className="text-primary hover:underline">
                        support@lazygamedevs.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Live Chat</h3>
                      <p className="text-muted-foreground mb-2">Chat with our support team</p>
                      <p className="text-sm text-muted-foreground">Available 24/7 for Pro users</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone Support</h3>
                      <p className="text-muted-foreground mb-2">For Enterprise customers</p>
                      <p className="text-primary">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Response Time</h3>
                      <p className="text-muted-foreground">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Options */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Other Ways to Get Help</h3>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Community Forum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">
                      Connect with other developers and get help from the community.
                    </p>
                    <Button variant="outline" size="sm">
                      Visit Forum
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5" />
                      Knowledge Base
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">
                      Search our comprehensive documentation and tutorials.
                    </p>
                    <Button variant="outline" size="sm">
                      Browse Docs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quick answers to common questions. Can't find what you're looking for? Contact us!
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">How quickly will I get a response?</h3>
              <p className="text-muted-foreground">
                We aim to respond to all inquiries within 24 hours. Pro and Enterprise customers
                get priority support with faster response times.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Do you offer phone support?</h3>
              <p className="text-muted-foreground">
                Phone support is available for Enterprise customers. Pro and Free users can reach
                us via email, chat, and our community forums.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Can I schedule a demo?</h3>
              <p className="text-muted-foreground">
                Absolutely! We offer personalized demos for teams and organizations.
                Contact us with "Demo Request" in the subject line.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">How can I provide feedback?</h3>
              <p className="text-muted-foreground">
                We love hearing from our users! Use the form above with "Feedback & Suggestions"
                as the subject, or reach out through our community forums.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Visit Our Office</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                While we're a remote-first company, you can find us in the heart of the tech scene.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">GameLearn HQ</h3>
                    <p className="text-muted-foreground">
                      123 Innovation Street<br />
                      Tech District, San Francisco<br />
                      CA 94105, USA
                    </p>
                  </div>
                  <Button variant="outline">
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}