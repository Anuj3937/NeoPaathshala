
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { GraduationCap, Upload, Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";

import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


const onboardingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters."}).optional(),
  board: z.enum(["cbse", "icse", "state", "other"]),
  customCurriculum: z.instanceof(File).optional(),
  grades: z.array(z.string()).min(1, { message: "Please select at least one grade." }),
  subjects: z.array(z.string()).min(1, { message: "Please select at least one subject." }),
  addToCalendar: z.boolean().default(false),
  workingSaturdays: z.boolean().default(false),
}).refine(data => {
    if (data.board === 'other') {
        return !!data.customCurriculum;
    }
    return true;
}, {
    message: "Please upload your curriculum file.",
    path: ["customCurriculum"],
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const allGrades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const allSubjects = ["Mathematics", "Science", "Social Studies", "English", "Hindi", "Computer Science"];

export default function OnboardingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            name: "",
            email: "",
            grades: [],
            subjects: [],
            addToCalendar: false,
            workingSaturdays: false,
        },
    });

    const handleGoogleSignIn = async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // New user
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            onboardingComplete: false,
          });
          // Pre-fill form and let them complete onboarding
          form.setValue("name", user.displayName || "");
          form.setValue("email", user.email || "");
           toast({
             title: "Welcome!",
             description: "Please complete your profile to get started.",
           });
        } else {
          // Returning user
          toast({
            title: "Welcome Back!",
            description: "Redirecting you to your dashboard.",
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error during Google sign-in:", error);
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: "Could not sign in with Google. Please try again.",
        });
      }
    };
    
    const handleManualSubmit = (data: OnboardingFormValues) => {
        console.log("Onboarding data submitted:", data);
        // In a real app, you would handle email/password sign up here
        alert("Account created! Redirecting to dashboard...");
        router.push('/dashboard');
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center mb-8 gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Welcome to Sahayak AI</h1>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Your Account or Log In</CardTitle>
            <CardDescription>
              Join Sahayak AI to unlock your personalized teaching assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Button variant="outline" onClick={handleGoogleSignIn}><Chrome className="mr-2"/> Continue with Google</Button>
            </div>
            <div className="flex items-center my-4">
                <Separator className="flex-1" />
                <span className="mx-4 text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-8">
                
                {/* Personal Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-headline">Sign Up with Email</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Priya Sharma" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="e.g., priya.sharma@school.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                             <FormDescription>
                                Already have an account? Your details will be used to log you in.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     </div>
                </div>

                {/* Curriculum Details */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-headline">Curriculum Details</h3>
                     <FormField
                        control={form.control}
                        name="board"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Which board does your school follow?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"
                                >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="cbse" />
                                    </FormControl>
                                    <FormLabel className="font-normal">CBSE</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="icse" />
                                    </FormControl>
                                    <FormLabel className="font-normal">ICSE</FormLabel>
                                </FormItem>
                                 <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="state" />
                                    </FormControl>
                                    <FormLabel className="font-normal">State Board</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="other" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Other / Custom</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {form.watch('board') === 'other' && (
                             <FormField
                                control={form.control}
                                name="customCurriculum"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload Curriculum</FormLabel>
                                    <FormControl>
                                         <div className="relative">
                                            <Input type="file" className="pl-12" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                            <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                         </div>
                                    </FormControl>
                                    <FormDescription>Please upload your syllabus or curriculum file (PDF, DOCX).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                </div>

                 {/* Subjects and Grades */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-headline">Subjects & Grades Taught</h3>
                     <div className="grid md:grid-cols-2 gap-8">
                       <FormField
                            control={form.control}
                            name="grades"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Grades</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {allGrades.map((item) => (
                                        <FormField
                                        key={item}
                                        control={form.control}
                                        name="grades"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, item])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== item
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="subjects"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Subjects</FormLabel>
                                    <div className="grid grid-cols-1 gap-4">
                                    {allSubjects.map((item) => (
                                        <FormField
                                        key={item}
                                        control={form.control}
                                        name="subjects"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, item])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== item
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Calendar Setup */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-headline">Calendar Setup</h3>
                    <FormField
                        control={form.control}
                        name="addToCalendar"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                Add Curriculum to Your Calendar
                                </FormLabel>
                                <FormDescription>
                                Automatically schedule your academic year, excluding weekends and national holidays.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                     {form.watch('addToCalendar') && (
                        <FormField
                            control={form.control}
                            name="workingSaturdays"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    Include working Saturdays in the schedule.
                                    </FormLabel>
                                </div>
                                </FormItem>
                            )}
                        />
                     )}
                </div>


                <CardFooter className="px-0">
                  <Button type="submit" size="lg" className="w-full">
                    Finish Onboarding & Go to Dashboard
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
