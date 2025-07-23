
"use client";

import { useState } from "react";
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
  File,
  Calendar,
  Power,
  RefreshCcw,
  Save,
  Printer,
  ArrowLeft,
  GraduationCap
} from "lucide-react";

import { conductVoiceBasedReadingAssessment } from "@/ai/flows/conduct-voice-based-reading-assessments";
import { createDifferentiatedWorksheets } from "@/ai/flows/create-differentiated-worksheets";
import { generateCulturallyRelevantContent } from "@/ai/flows/generate-culturally-relevant-content";
import { generateVisualAids } from "@/ai/flows/generate-visual-aids";
import { provideInstantLocalizedExplanations } from "@/ai/flows/provide-instant-localized-explanations";
import { generateLessonKit } from "@/ai/flows/generate-lesson-kit";

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


const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


const actions = [
  { value: "lesson-kit", label: "Lesson Kit Generator", icon: Package, needsFile: false, fileType: null },
  { value: "content-generation", label: "Content Generation", icon: BookText, needsFile: false, fileType: null },
  { value: "worksheet-creation", label: "Worksheet Creation", icon: FileText, needsFile: true, fileType: "image/*" },
  { value: "localized-explanations", label: "Localized Explanations", icon: Languages, needsFile: false, fileType: null },
  { value: "visual-aids", label: "Visual Aids", icon: ImageIcon, needsFile: false, fileType: null },
  { value: "reading-assessment", label: "Reading Assessment", icon: AudioLines, needsFile: true, fileType: "audio/*" },
] as const;

type ActionValue = (typeof actions)[number]['value'];

const formSchema = z.object({
  action: z.enum(actions.map(a => a.value) as [ActionValue, ...ActionValue[]], {
    required_error: "Please select an action.",
  }),
  prompt: z.string().min(1, "Please enter a prompt."),
  file: z.instanceof(File).optional(),
}).refine(data => {
  const selectedAction = actions.find(a => a.value === data.action);
  if (selectedAction?.needsFile) {
    return !!data.file;
  }
  return true;
}, {
  message: "A file is required for this action.",
  path: ["file"],
});

type FormValues = z.infer<typeof formSchema>;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  action: ActionValue;
  title?: string;
  regenerate?: () => void;
};

export default function ChatPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const [filePreview, setFilePreview] = useState<{url: string, name: string, type: 'image' | 'audio'} | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      action: "content-generation",
    },
  });

  const selectedActionValue = form.watch('action');
  const selectedAction = actions.find(a => a.value === selectedActionValue);

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

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setMessages([]); // Clear messages for new interaction

    let assistantResponse: React.ReactNode = null;
    let responseTitle = "Generated Content";
    
    try {
      switch (values.action) {
        case "lesson-kit": {
          responseTitle = "Lesson Kit";
          const result = await generateLessonKit({ lessonTopic: values.prompt, language: 'English' });
          assistantResponse = (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookText /> Lesson Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background/50 p-4 font-body">
                    {result.lessonPlan}
                  </div>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ImageIcon /> Visual Aid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="prose-sm max-w-none rounded-md bg-background/50 p-4 font-body">{result.visualAid.diagramDescription}</p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <Image src={result.visualAid.diagramDataUri} alt="Generated visual aid" fill objectFit="contain" />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
          break;
        }
        case "content-generation": {
          responseTitle = "Generated Story";
          const result = await generateCulturallyRelevantContent({ prompt: values.prompt, language: 'English' });
          assistantResponse = <div className="prose-sm max-w-none whitespace-pre-wrap font-body p-4">{result.content}</div>;
          break;
        }
        case "worksheet-creation": {
          responseTitle = "Differentiated Worksheets";
          const textbookImage = await toBase64(values.file!);
          const result = await createDifferentiatedWorksheets({ textbookImage, gradeLevels: ["Grade 1", "Grade 3", "Grade 5"] });
           assistantResponse = (
             <Accordion type="single" collapsible className="w-full">
               {result.worksheets.map((worksheet) => (
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
          break;
        }
        case "localized-explanations": {
          responseTitle = "Localized Explanation";
          const result = await provideInstantLocalizedExplanations({ prompt: values.prompt, language: 'English' });
          assistantResponse = <div className="prose-sm max-w-none whitespace-pre-wrap font-body p-4">{result.explanation}</div>;
          break;
        }
        case "visual-aids": {
          responseTitle = "Visual Aid";
          const result = await generateVisualAids({ lessonTopic: values.prompt });
           assistantResponse = (
             <div className="space-y-4 p-4">
               <p className="prose-sm max-w-none rounded-md bg-background/50 p-4 font-body">{result.diagramDescription}</p>
               <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                 <Image src={result.diagramDataUri} alt="Generated visual aid" fill objectFit="contain" />
               </div>
             </div>
           );
          break;
        }
        case "reading-assessment": {
          responseTitle = "Reading Assessment";
           const studentRecording = await toBase64(values.file!);
           const result = await conductVoiceBasedReadingAssessment({ studentName: 'Student', readingText: values.prompt, studentRecording });
           assistantResponse = (
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
                       {result.comprehensionQuestions.map((q, i) => (<li key={i}>{q}</li>))}
                     </ul>
                   </CardContent>
                 </Card>
             </div>
           );
          break;
        }
        default:
          throw new Error("Invalid action selected.");
      }

       const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: assistantResponse,
        action: values.action,
        title: responseTitle,
        regenerate: () => handleRegenerate(values),
      };
      setMessages([assistantMessage]);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
      // form.reset({ prompt: "", action: values.action });
      // setFilePreview(null);
    }
  }

  const clearChat = () => {
    setMessages([]);
    form.reset();
    setFilePreview(null);
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={clearChat}><Home/></Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-primary bg-primary/10">Resources</Button>
            <Button variant="ghost">Weekly Calendar</Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">English</Button>
          <Button variant="ghost" size="icon"><Power /></Button>
          <Avatar className="h-8 w-8"><AvatarFallback>PS</AvatarFallback></Avatar>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="bg-card rounded-2xl p-8 shadow-lg max-w-2xl w-full">
                  <h1 className="text-4xl font-bold text-foreground mb-4 font-headline">Welcome!</h1>
                  <p className="text-lg text-muted-foreground mb-8">How can I help you today?</p>
                   <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="relative">
                           <FormField
                              control={form.control}
                              name="prompt"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      placeholder="How can I help?"
                                      className="bg-background/50 h-14 rounded-full px-8 text-lg" 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button type="submit" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-primary hover:bg-primary/90" disabled={isLoading}>
                              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                           <FormField
                              control={form.control}
                              name="action"
                              render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="font-body w-auto gap-2 border-none bg-muted/50 rounded-full">
                                        {selectedAction && <selectedAction.icon className="h-5 w-5" />}
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {actions.map(action => (
                                        <SelectItem key={action.value} value={action.value} className="font-body">
                                          <div className="flex items-center gap-3">
                                            <action.icon className="h-5 w-5 text-muted-foreground" />
                                            <span>{action.label}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                             {selectedAction?.needsFile && (
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="icon" className="rounded-full">
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Paperclip className="h-5 w-5"/>
                                        </label>
                                    </Button>
                                    <Input id="file-upload" type="file" className="hidden" accept={selectedAction.fileType || "*"} onChange={handleFileChange} />
                                </div>
                              )}
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
                         <FormMessage>{form.formState.errors.prompt?.message || form.formState.errors.file?.message}</FormMessage>
                    </form>
                  </Form>
                </div>
            </div>
        )}

        {isLoading && (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="font-body text-lg">Generating content, please wait...</p>
                </div>
            </div>
        )}

        {messages.map(message => (
          <div key={message.id}>
            {message.role === 'assistant' && (
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl shadow-primary/10">
                <CardHeader className="flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={clearChat}><ArrowLeft /></Button>
                    <CardTitle className="text-xl font-headline">{message.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-sm">{selectedAction?.label}</Badge>
                </CardHeader>
                <CardContent>
                  {message.content}
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/>Print</Button>
                  <Button variant="outline" onClick={message.regenerate} disabled={isLoading}><RefreshCcw className="mr-2"/>Regenerate</Button>
                  <Button><Save className="mr-2" />Save</Button>
                </CardFooter>
              </Card>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
