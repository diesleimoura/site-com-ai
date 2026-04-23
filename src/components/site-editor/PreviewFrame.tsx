import * as React from "react";
import { cn } from "@/lib/utils";

const EMPTY_HTML =
  "<html><body><p style='font-family:sans-serif;padding:2rem'>Sem conteúdo gerado</p></body></html>";

type Props = {
  title: string;
  html: string | null;
  viewport: "mobile" | "desktop";
};

function PreviewFrameImpl({ title, html, viewport }: Props) {
  return (
    <iframe
      title={title}
      srcDoc={html ?? EMPTY_HTML}
      className={cn(
        "border-0 bg-white transition-all",
        viewport === "mobile"
          ? "h-[calc(100vh-200px)] w-[375px] rounded-lg shadow-md"
          : "h-[calc(100vh-160px)] w-full",
      )}
      sandbox="allow-same-origin"
    />
  );
}

export const PreviewFrame = React.memo(PreviewFrameImpl, (prev, next) => {
  return (
    prev.html === next.html &&
    prev.viewport === next.viewport &&
    prev.title === next.title
  );
});
