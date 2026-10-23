
import fs from "node:fs";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

const extractText = async (filePath) => {
    const buffer = fs.readFileSync(filePath);

    const pdf = new PDFParse({
        data: new Uint8Array(buffer),
        CanvasFactory,
    });

    try {
        const result = await pdf.getText();
        return result.text;
    } finally {
        await pdf.destroy();
    }
};

export default extractText;
