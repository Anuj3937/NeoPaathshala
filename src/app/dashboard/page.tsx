
"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BookText,
  FileText,
  Languages,
  ImageIcon,
  AudioLines,
  Send,
  Loader2,
  Paperclip,
  Mic,
  X,
  BookOpenCheck,
  Package,
  Home,
  Power,
  RefreshCcw,
  Save,
  Printer,
  ArrowLeft,
  Sparkles,
  ClipboardList,
  Calendar,
  Puzzle,
  Copy,
  FlipHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isSameDay as isSameDate, getDay, nextMonday } from 'date-fns';


import { conductVoiceBasedReadingAssessment, type ConductVoiceBasedReadingAssessmentOutput } from "@/ai/flows/conduct-voice-based-reading-assessments";
import { createDifferentiatedWorksheets, type CreateDifferentiatedWorksheetsOutput } from "@/ai/flows/create-differentiated-worksheets";
import { generateCulturallyRelevantContent, type GenerateCulturallyRelevantContentOutput } from "@/ai/flows/generate-culturally-relevant-content";
import { generateLessonKit, type GenerateLessonKitOutput } from "@/ai/flows/generate-lesson-kit";
import { generateVisualAids, type GenerateVisualAidsOutput } from "@/ai/flows/generate-visual-aids";
import { generateWeeklyPlan, type GenerateWeeklyPlanOutput } from "@/ai/flows/generate-weekly-plan";
import { provideInstantLocalizedExplanations, type ProvideInstantLocalizedExplanationsOutput } from "@/ai/flows/provide-instant-localized-explanations";
import { generatePuzzles, type GeneratePuzzlesOutput } from "@/ai/flows/generate-puzzles";
import { generateFlashcards, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";


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
  FormField,
  FormItem,
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
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";


const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


const languages = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Gujarati', label: 'Gujarati' },
] as const;

type LanguageValue = (typeof languages)[number]['value'];

const allActions = [
    { value: 'generateLessonKit', label: 'Lesson Kit', icon: Package },
    { value: 'generateWeeklyPlan', label: 'Weekly Plan', icon: Calendar },
    { value: 'createDifferentiatedWorksheets', label: 'Worksheets', icon: FileText },
    { value: 'generateVisualAids', label: 'Visual Aids', icon: ImageIcon },
    { value: 'generatePuzzles', label: 'Puzzles', icon: Puzzle },
    { value: 'generateFlashcards', label: 'Flashcards', icon: Copy },
    { value: 'conductVoiceBasedReadingAssessment', label: 'Reading Assessment', icon: AudioLines },
    { value: 'generateCulturallyRelevantContent', label: 'Cultural Content', icon: BookText },
    { value: 'provideInstantLocalizedExplanations', label: 'Explain a Topic', icon: Sparkles },
] as const;

const guestActions = [
    { value: 'generateVisualAids', label: 'Visual Aids', icon: ImageIcon },
    { value: 'provideInstantLocalizedExplanations', label: 'Explain a Topic', icon: Sparkles },
]

type ActionValue = (typeof allActions)[number]['value'];
const actionsRequiringFile: ActionValue[] = ['generateWeeklyPlan', 'createDifferentiatedWorksheets', 'conductVoiceBasedReadingAssessment'];


const formSchema = z.object({
  prompt: z.string().min(1, "Please enter a prompt."),
  file: z.instanceof(File).optional(),
  language: z.enum(languages.map(l => l.value) as [LanguageValue, ...LanguageValue[]]).default('English'),
  action: z.enum(allActions.map(a => a.value) as [ActionValue, ...ActionValue[]]),
});

type FormValues = z.infer<typeof formSchema>;

type Lesson = {
  id: string;
  date: string; // ISO string
  topic: string;
  activities: string;
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  regenerate?: () => void;
  payload?: any;
  action?: ActionValue;
};

type View = "home" | "calendar";

function DashboardPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const [filePreview, setFilePreview] = useState<{url: string, name: string, type: 'image' | 'audio'} | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Lesson[]>([]);
  const [currentView, setCurrentView] = useState<View>("home");
  const [currentDate, setCurrentDate] = useState(new Date());

  const searchParams = useSearchParams();
  const router = useRouter();
  const isGuestMode = searchParams.get('mode') === 'guest';
  
  const availableActions = isGuestMode ? guestActions : allActions;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      language: "English",
      action: availableActions[0].value as ActionValue,
    },
  });
  
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    form.reset({
      prompt: "",
      language: form.getValues('language'),
      action: availableActions[0].value as ActionValue,
    });
  }, [isGuestMode]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'audio';
      setFilePreview({ url, name: file.name, type });
    }
  };

  const removeFile = () => {
    form.setValue('file', undefined);
    setFilePreview(null);
  };

  const handleRegenerate = (originalValues: FormValues) => {
    onSubmit(originalValues);
  }
  
  const handleApprove = (lessons: GenerateWeeklyPlanOutput['lessons']) => {
    if (isGuestMode) {
      toast({
        variant: 'destructive',
        title: 'Feature Locked',
        description: 'Please sign up to save lesson plans to your calendar.',
      });
      return;
    }
    const weekStart = nextMonday(new Date());
    const dayToOffset: {[key: string]: number} = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
    }

    const newEvents = lessons.map(lesson => {
        const offset = dayToOffset[lesson.day] ?? 0;
        const lessonDate = addDays(weekStart, offset);
        return {
            id: `lesson-${Date.now()}-${Math.random()}`,
            date: lessonDate.toISOString(),
            topic: lesson.topic,
            activities: lesson.activities
        }
    });

    setCalendarEvents(prevEvents => [...prevEvents, ...newEvents]);
    toast({
      title: "Plan Approved!",
      description: "The weekly lesson plan has been added to your calendar.",
    });
    setMessages([]);
    setCurrentView('calendar');
  };

  const handleAction = async (values: FormValues) => {
    const { action, ...rest } = values;
    const fileDataUri = values.file ? await toBase64(values.file) : undefined;
    
    // Simplistic mapping for now. Can be improved.
    const input = {
        language: rest.language,
        lessonTopic: rest.prompt,
        prompt: rest.prompt,
        query: rest.prompt,
        textbookImage: fileDataUri,
        studentRecording: fileDataUri,
        readingText: rest.prompt, // Assuming reading text is the prompt
        studentName: 'Student', // Placeholder
        gradeLevels: ['Grade 3', 'Grade 4'], // Placeholder
        topic: rest.prompt,
    };

    switch (action) {
        case 'generateWeeklyPlan':
            if (!input.textbookImage) throw new Error("A textbook image is required for this action.");
            return await generateWeeklyPlan({ textbookImage: input.textbookImage, language: input.language });
        case 'generateLessonKit':
            return await generateLessonKit({ lessonTopic: input.lessonTopic, language: input.language });
        case 'generateCulturallyRelevantContent':
            return await generateCulturallyRelevantContent({ prompt: input.prompt, language: input.language });
        case 'createDifferentiatedWorksheets':
             if (!input.textbookImage) throw new Error("A textbook image is required for this action.");
            return await createDifferentiatedWorksheets({ textbookImage: input.textbookImage, gradeLevels: input.gradeLevels, language: input.language });
        case 'provideInstantLocalizedExplanations':
            return await provideInstantLocalizedExplanations({ query: input.query, language: input.language });
        case 'generateVisualAids':
            return await generateVisualAids({ lessonTopic: input.lessonTopic });
        case 'conductVoiceBasedReadingAssessment':
            if (!input.studentRecording) throw new Error("A student recording is required for this action.");
            return await conductVoiceBasedReadingAssessment({ studentRecording: input.studentRecording, readingText: input.readingText, studentName: input.studentName });
        case 'generatePuzzles':
            return await generatePuzzles({ topic: input.topic, language: input.language });
        case 'generateFlashcards':
            return await generateFlashcards({ topic: input.topic, language: input.language });
        default:
            throw new Error(`Unknown action: ${action}`);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  const renderActionResponse = (action: ActionValue, response: any) => {
    switch (action) {
      case "generateWeeklyPlan": {
        const result = response as GenerateWeeklyPlanOutput;
        return (
          <Card>
             <CardHeader>
               <CardTitle>Weekly Plan</CardTitle>
               <CardDescription>Here is your generated lesson plan for the week. Review and approve to add it to your calendar.</CardDescription>
             </CardHeader>
             <CardContent>
                 <ul className="space-y-4">
                   {result.lessons.map((lesson: any) => (
                     <li key={lesson.day} className="border p-4 rounded-md">
                       <h4 className="font-bold font-headline">{lesson.day}: {lesson.topic}</h4>
                       <p className="font-body">{lesson.activities}</p>
                     </li>
                   ))}
                 </ul>
             </CardContent>
             <CardFooter className="justify-end">
                 <Button onClick={() => handleApprove(result.lessons)} disabled={isGuestMode}>Approve & Add to Calendar</Button>
             </CardFooter>
         </Card>
        );
      }
      case "generateLessonKit": {
          const result = response as GenerateLessonKitOutput;
          return (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BookText /> Lesson Plan</CardTitle></CardHeader>
                <CardContent><div className="prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background/50 p-4 font-body">{result.lessonPlan}</div></CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Visual Aid</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="prose-sm max-w-none rounded-md bg-background/50 p-4 font-body">{result.visualAid.diagramDescription}</p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <Image src={result.visualAid.diagramDataUri} alt="Generated visual aid" fill objectFit="contain" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Worksheet</CardTitle></CardHeader>
                <CardContent><div className="prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background/50 p-4 font-body">{result.worksheet}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles /> Fun Activity</CardTitle></CardHeader>
                <CardContent><div className="prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background/50 p-4 font-body">{result.activity}</div></CardContent>
              </Card>
            </div>
          );
        }
       case "generateCulturallyRelevantContent": {
          const result = response as GenerateCulturallyRelevantContentOutput;
          return <div className="prose-sm max-w-none whitespace-pre-wrap font-body p-4">{result.content}</div>;
       }
       case "createDifferentiatedWorksheets": {
           const result = response as CreateDifferentiatedWorksheetsOutput;
           return (
             <Accordion type="single" collapsible className="w-full">
               {result.worksheets.map((worksheet: any) => (
                 <AccordionItem value={worksheet.gradeLevel} key={worksheet.gradeLevel}>
                   <AccordionTrigger className="font-headline px-4">{worksheet.gradeLevel}</AccordionTrigger>
                   <AccordionContent>
                     <div className="prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background/50 p-4 font-body">
                       {worksheet.worksheetContent}
                     </div>
                   </AccordionContent>
                 </AccordionItem>
               ))}
             </Accordion>
           );
       }
       case "provideInstantLocalizedExplanations": {
          const result = response as ProvideInstantLocalizedExplanationsOutput;
          return <div className="prose-sm max-w-none whitespace-pre-wrap font-body p-4">{result.explanation}</div>;
       }
       case "generateVisualAids": {
           const result = response as GenerateVisualAidsOutput;
           return (
             <div className="space-y-4 p-4">
               <p className="prose-sm max-w-none rounded-md bg-background/50 p-4 font-body">{result.diagramDescription}</p>
               <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                 <Image src={result.diagramDataUri} alt="Generated visual aid" fill objectFit="contain" />
               </div>
             </div>
           );
       }
       case "conductVoiceBasedReadingAssessment": {
           const result = response as ConductVoiceBasedReadingAssessmentOutput;
           return (
             <div className="space-y-4 p-4">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <BookOpenCheck className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="font-headline text-lg">Accuracy Score</CardTitle>
                      <p className="text-4xl font-bold text-primary">{result.accuracyScore}%</p>
                    </div>
                  </CardHeader>
                </Card>
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg">Fluency Feedback</CardTitle>
                   </CardHeader>
                   <CardContent><div className="prose-sm max-w-none font-body">{result.fluencyFeedback}</div></CardContent>
                 </Card>
                  <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg">Comprehension Questions</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <ul className="list-inside list-disc space-y-2 font-body">
                       {result.comprehensionQuestions.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                     </ul>
                   </CardContent>
                 </Card>
             </div>
           );
       }
       case "generatePuzzles":
          return <RenderPuzzle response={response as GeneratePuzzlesOutput} />;
       case "generateFlashcards":
          return <RenderFlashcards response={response as GenerateFlashcardsOutput} />;
      default:
        return <div className="prose-sm max-w-none whitespace-pre-wrap font-body p-4">{response.explanation || "Sorry, I couldn't process that request."}</div>;
    }
  };


  async function onSubmit(values: FormValues) {
    if (actionsRequiringFile.includes(values.action) && !values.file) {
        toast({
            variant: 'destructive',
            title: 'File Required',
            description: `The "${allActions.find(a => a.value === values.action)?.label}" action requires a file to be attached. Please upload a file.`,
        });
        return;
    }

    setIsLoading(true);
    setCurrentView("home");
    setMessages([]);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: (
          <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8"><AvatarFallback>You</AvatarFallback></Avatar>
              <div className="rounded-2xl bg-muted/50 p-4">
                  <p>{values.prompt}</p>
                  {filePreview && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="gap-2 rounded-full p-2 text-sm">
                        {filePreview.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        <span className="truncate max-w-[100px]">{filePreview.name}</span>
                      </Badge>
                    </div>
                  )}
              </div>
          </div>
      )
    };
    setMessages([userMessage]);
    
    try {
      const result = await handleAction(values);

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        action: values.action,
        content: renderActionResponse(values.action, result),
        regenerate: () => handleRegenerate(values),
        payload: result,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: error.message || 'Something went wrong. Please try again.',
      });
      setMessages([]); // Clear messages on error
    } finally {
      setIsLoading(false);
      setFilePreview(null);
      form.reset({ prompt: "", language: values.language, file: undefined, action: values.action });
    }
  }

  const clearChat = () => {
    setMessages([]);
    form.reset();
    setFilePreview(null);
    setCurrentView("home");
  }

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <div className="bg-card rounded-2xl p-8 shadow-lg max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-headline">Welcome!</h1>
          <p className="text-lg text-muted-foreground mb-8">How can I help you today?</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                   <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter a topic, like 'The Solar System' or 'Indian Freedom Struggle'..."
                              className="bg-background/50  rounded-2xl p-4 text-lg min-h-[100px] resize-none" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                        <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="font-body w-full gap-2 rounded-full bg-muted/50">
                                <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableActions.map(act => (
                                <SelectItem key={act.value} value={act.value} className="font-body">
                                <div className="flex items-center gap-2">
                                  <act.icon className="h-5 w-5" />
                                  {act.label}
                                </div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </FormItem>
                    )}
                 />

                <div className="flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-2">
                         <Button asChild variant="outline" size="icon" className="rounded-full">
                             <label htmlFor="file-upload" className="cursor-pointer">
                                 <Paperclip className="h-5 w-5"/>
                             </label>
                         </Button>
                         <Input id="file-upload" type="file" className="hidden" accept="image/*,audio/*" onChange={handleFileChange} />
                         {filePreview && (
                            <Badge variant="secondary" className="gap-2 rounded-full p-2 text-sm">
                              {filePreview.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                              <span className="truncate max-w-[100px]">{filePreview.name}</span>
                              <Button variant="ghost" size="icon" onClick={removeFile} className="h-5 w-5 -mr-1">
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          )}
                     </div>
                     <Button type="submit" size="lg" className="rounded-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : <><Send className="mr-2"/> Generate</>}
                    </Button>
                </div>
                 <FormMessage>{form.formState.errors.prompt?.message || form.formState.errors.file?.message}</FormMessage>
            </form>
        </div>
    </div>
  );

  const renderHomeView = () => (
    <>
      {messages.length === 0 && !isLoading && renderWelcome()}

      {isLoading && messages.length <= 1 && (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="font-body text-lg">Generating content, please wait...</p>
          </div>
        </div>
      )}
      
      <div className="space-y-8">
        {messages.map(message => (
          <div key={message.id}>
              {message.role === 'user' && message.content}
              {message.role === 'assistant' && (
                <div className="flex items-start gap-4">
                  <Avatar className="h-8 w-8 border-2 border-primary"><AvatarFallback className="bg-transparent"><Sparkles className="text-primary"/></AvatarFallback></Avatar>
                  <div className="flex-1">
                     <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl shadow-primary/10 w-full">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                               {allActions.find(a => a.value === message.action)?.icon ? React.createElement(allActions.find(a => a.value === message.action)!.icon) : <Sparkles />}
                               {allActions.find(a => a.value === message.action)?.label}
                           </CardTitle>
                        </CardHeader>
                       <CardContent>
                         {message.content}
                       </CardContent>
                       <CardFooter className="justify-end gap-2">
                         <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/>Print</Button>
                         {message.regenerate && <Button variant="outline" onClick={message.regenerate} disabled={isLoading}><RefreshCcw className="mr-2"/>Regenerate</Button>}
                         {!isGuestMode && <Button><Save className="mr-2" />Save</Button>}
                       </CardFooter>
                     </Card>
                  </div>
                </div>
              )}
          </div>
        ))}
        
        {messages.length > 0 && !isLoading && (
           <div className="text-center">
            <Button variant="outline" onClick={clearChat}><RefreshCcw className="mr-2"/>Start New Chat</Button>
          </div>
        )}
      </div>
    </>
  );

  const renderCalendarView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="font-headline text-2xl">{format(currentDate, 'MMMM yyyy')}</CardTitle>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 text-center font-bold font-headline text-muted-foreground">
                    {dayNames.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 gap-1">
                    {days.map(d => {
                        const dayEvents = calendarEvents.filter(e => isSameDate(parseISO(e.date), d));
                        return (
                            <div
                                key={d.toString()}
                                className={cn(
                                    "border rounded-md p-2 h-28 flex flex-col",
                                    !isSameMonth(d, monthStart) && "text-muted-foreground/50 bg-muted/20",
                                    isSameDay(d, new Date()) && "bg-primary/20"
                                )}
                            >
                                <span className={cn("font-bold", isSameDay(d, new Date()) && "text-primary")}>
                                  {format(d, 'd')}
                                </span>
                                <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1">
                                    {dayEvents.map(event => (
                                      <div key={event.id} className="bg-primary/80 text-primary-foreground p-1 rounded-md text-ellipsis overflow-hidden whitespace-nowrap">
                                        {event.topic}
                                      </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
             <CardFooter className="justify-center">
                 <p className="text-sm text-muted-foreground">
                    {calendarEvents.length > 0 ? "Your approved weekly plans are shown here." : "Your calendar is empty. Generate and approve a weekly plan to see it here."}
                 </p>
             </CardFooter>
        </Card>
    );
};


  return (
    <div className="flex h-screen flex-col bg-muted/20">
       <Form {...form}>
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
             <Button variant={currentView === 'home' ? 'secondary' : 'ghost'} onClick={() => setCurrentView('home')}>Resources</Button>
             <Button variant={currentView === 'calendar' ? 'secondary' : 'ghost'} onClick={() => setCurrentView('calendar')} disabled={isGuestMode}>Weekly Calendar</Button>
          </div>
          <div className="flex items-center gap-4">
            <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-body w-[120px] gap-2 border-none bg-muted/50 rounded-full">
                          <Languages className="h-5 w-5" />
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value} className="font-body">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut /></Button>
            <Avatar className="h-8 w-8"><AvatarFallback>{isGuestMode ? 'G' : 'PS'}</AvatarFallback></Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {isGuestMode && (
                  <Alert className="mb-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Guest Mode</AlertTitle>
                    <AlertDescription>
                      You are currently in guest mode. Some features like saving content and weekly planning are disabled. <Link href="/onboarding" className="font-bold underline">Sign Up</Link> to get full access.
                    </AlertDescription>
                  </Alert>
                )}
                {currentView === 'home' ? renderHomeView() : renderCalendarView()}
            </div>
        </main>
      </Form>
    </div>
  );
}


function RenderPuzzle({ response }: { response: GeneratePuzzlesOutput }) {
    const [showSolution, setShowSolution] = useState(false);
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{response.title}</CardTitle>
                    <CardDescription>{response.instructions}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold mb-2">Word List</h4>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-body">
                           {response.words.map((word: string, i: number) => <li key={i}>{word}</li>)}
                        </ul>
                    </div>
                    <div>
                         <h4 className="font-bold mb-2">Puzzle Grid</h4>
                         <div className="bg-background/50 p-4 rounded-md font-mono text-center tracking-widest leading-relaxed">
                            { (showSolution ? response.solution : response.grid).map((row: string[], rowIndex: number) => (
                                <div key={rowIndex} className="flex justify-center">
                                    {row.map((cell, cellIndex) => (
                                        <span key={cellIndex} className="w-6 h-6 flex items-center justify-center">
                                            {cell}
                                        </span>
                                    ))}
                                </div>
                             ))}
                         </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button variant="outline" onClick={() => setShowSolution(!showSolution)}>
                        {showSolution ? "Hide Solution" : "Show Solution"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function RenderFlashcards({ response }: { response: GenerateFlashcardsOutput }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {response.flashcards.map((card: { front: string, back: string }, index: number) => (
                <Flashcard key={index} front={card.front} back={card.back} />
            ))}
        </div>
    );
}

function Flashcard({ front, back }: { front: string, back: string }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="w-full h-48 [perspective:1000px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={cn("relative w-full h-full text-center transition-transform duration-700 [transform-style:preserve-3d]",
                isFlipped && "[transform:rotateY(180deg)]"
                )}>
                {/* Front */}
                <div className="absolute w-full h-full p-4 flex items-center justify-center bg-card-foreground/10 border rounded-md [backface-visibility:hidden]">
                    <p className="text-lg font-semibold font-body">{front}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full p-4 flex items-center justify-center bg-primary/20 border rounded-md [transform:rotateY(180deg)] [backface-visibility:hidden]">
                     <p className="text-md font-body">{back}</p>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <DashboardPageContent />
    </React.Suspense>
  )
}
