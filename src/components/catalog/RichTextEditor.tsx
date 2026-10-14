import { Editor } from "@tinymce/tinymce-react";
import "tinymce/tinymce";
import "tinymce/models/dom/model";
import "tinymce/themes/silver";
import "tinymce/icons/default";
import "tinymce/skins/ui/oxide/skin.js";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/preview";
import "tinymce/skins/ui/oxide/content.js";
import "tinymce/skins/content/default/content.js";

export default function RichTextEditor({ value, onChange, height = 300 }: { value: string; onChange: (v: string) => void; height?: number }) {
    return (
        <Editor
            licenseKey="gpl"
            value={value}
            onEditorChange={(v) => onChange(v)}
            init={{
                height,
                menubar: "file edit view insert format tools table",
                plugins: ["lists", "link", "table", "code", "wordcount", "searchreplace", "fullscreen", "preview"],
                toolbar: "undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link table | removeformat code",
                branding: false,
                promotion: false,
                statusbar: true,
                elementpath: false,
                resize: true,
                content_style: "body{font-family:-apple-system,Segoe UI,sans-serif;font-size:14px}",
            }}
        />
    );
}