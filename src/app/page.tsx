
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookText, Calendar, Languages, BrainCircuit, UserPlus, LogIn, User } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-card/80 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold font-headline">Sahayak AI</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            How It Works
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/onboarding" prefetch={false}>
              <LogIn className="mr-2" />
              Log In
            </Link>
          </Button>
           <Button asChild>
            <Link href="/onboarding" prefetch={false}>
                <UserPlus className="mr-2" />
                Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your AI-Powered Teaching Co-Pilot
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Sahayak AI helps teachers in multi-grade classrooms create personalized lesson plans, generate engaging content, and assess students with ease.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/onboarding" prefetch={false}>
                      Get Started For Free
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                     <Link href="/dashboard?mode=guest" prefetch={false}>
                        <User className="mr-2"/>
                        Try as Guest
                     </Link>
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground">Sign up to save your work and access all features.</p>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                data-ai-hint="classroom teacher"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Everything a Teacher Needs</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From lesson planning to student assessment, Sahayak AI has you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <BookText className="h-10 w-10 text-primary mb-4"/>
                    <CardTitle className="font-headline">Lesson Kit Generation</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>Instantly generate complete lesson kits with plans, visual aids, worksheets, and activities.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Calendar className="h-10 w-10 text-primary mb-4"/>
                    <CardTitle className="font-headline">Weekly Planner</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>Upload textbook content and get a full weekly teaching schedule generated and added to your calendar.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Languages className="h-10 w-10 text-primary mb-4"/>
                    <CardTitle className="font-headline">Localized Content</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>Generate all content in various regional languages to better connect with your students.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">How It Works</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Leveraging AI in Your Classroom</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Sahayak AI is more than a tool; it's a partner. Here's how to integrate it seamlessly into your teaching workflow.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-2">
                    <div className="flex items-start gap-4">
                        <BrainCircuit className="h-10 w-10 text-primary mt-1"/>
                        <div>
                            <h3 className="text-xl font-bold font-headline">From Idea to Implementation</h3>
                            <p className="text-muted-foreground">
                                Start with a simple topic idea, like "Photosynthesis." Use the **Lesson Kit Generator** to create a foundational plan. Then, use the **Worksheet Generator** with a textbook page to create differentiated exercises. Finally, generate **Puzzles** and **Flashcards** for fun reinforcement activities.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <BrainCircuit className="h-10 w-10 text-primary mt-1"/>
                        <div>
                            <h3 className="text-xl font-bold font-headline">Personalize and Localize</h3>
                            <p className="text-muted-foreground">
                                Don't just generate content; refine it. Use the **Cultural Content** tool to create stories that resonate with your students' backgrounds. Use the **Explain a Topic** feature in your students' native language to clarify complex concepts with relatable analogies.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <BrainCircuit className="h-10 w-10 text-primary mt-1"/>
                        <div>
                            <h3 className="text-xl font-bold font-headline">Plan Your Week in Minutes</h3>
                            <p className="text-muted-foreground">
                                Snap a picture of your textbook's table of contents or a specific chapter. Use the **Weekly Plan** generator to get a structured, five-day plan. Approve it to automatically add it to your calendar, giving you a high-level overview of your week instantly.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <BrainCircuit className="h-10 w-10 text-primary mt-1"/>
                        <div>
                            <h3 className="text-xl font-bold font-headline">Assess with Ease</h3>
                            <p className="text-muted-foreground">
                                Use the **Reading Assessment** tool for quick, objective evaluations. Have a student read a passage into a microphone, upload the audio, and get instant feedback on accuracy and fluency, along with generated comprehension questions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Sahayak AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
