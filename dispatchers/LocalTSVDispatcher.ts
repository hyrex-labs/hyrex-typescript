import { v5 as uuidv5, v4 as uuidv4 } from "uuid";
import { HyrexDispatcher, SerializedTask } from "./HyrexDispatcher";
import { UUID } from "../utils";
import { writeFileSync, appendFileSync, readFileSync, createReadStream, createWriteStream, renameSync} from 'fs';
import * as readline from 'readline';
import * as path from 'path';


type status = "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED"

export class LocalTSVDispatcher implements HyrexDispatcher {
    private fileName: string

    constructor() {
        this.fileName = "./tasks.tsv"
    }

    async updateAndWriteQueuedTasks(n: number) {
        const tempFilePath = path.join(__dirname, 'temp_tasks.tsv');
        const fileStream = createReadStream(this.fileName);
        const tempFileStream = createWriteStream(tempFilePath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let queuedCount = 0;

        // Process each line of the original file
        for await (const line of rl) {
            const columns = line.split('\t'); // Split the line into columns by tab
            const status = columns[2]; // Assuming the status is in the 3rd column

            // Update status if it is QUEUED and within the first 'n' tasks
            if (status === 'QUEUED' && queuedCount < n) {
                columns[2] = 'RUNNING'; // Change status from QUEUED to RUNNING
                queuedCount++;
            }

            // Write the modified (or unmodified) line to the temporary file
            tempFileStream.write(columns.join('\t') + '\n');
        }

        tempFileStream.end();

        // Replace the original file with the updated file
        renameSync(tempFilePath, this.fileName);

        console.log(`Updated the status of the first ${n} QUEUED tasks to RUNNING and wrote back to the file.`);
    }


    async enqueue(serializedTasks: SerializedTask[]): Promise<UUID[]> {
        const data = serializedTasks.map((task => [
            uuidv4(),
            task.name,
            "QUEUED",
            JSON.stringify(task.config),
            JSON.stringify(task.context)
        ]))

        const tsvData = data.map(row => row.join('\t')).join('\n') + '\n';

        appendFileSync(this.fileName, tsvData, 'utf-8');

        console.log(`Data has been appended to ${this.fileName}`);

        return [""]
    }

    async dequeue({ numTasks }: { numTasks: number }) {
        // const fileContent = readFileSync(this.fileName, 'utf-8');
        //
        // // Split the content by rows and then by columns (tabs)
        // const data = fileContent
        //     .trim() // Remove any trailing newlines or spaces
        //     .split('\n') // Split into rows
        await this.updateAndWriteQueuedTasks(numTasks)
    }
}
