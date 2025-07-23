import { GraduationCap } from "lucide-react";

export function Logo() {
    return (
        <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold font-headline">Sahayak AI</h2>
        </div>
    );
}
