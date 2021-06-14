import { UPLOAD_CONFIG } from '@app/config/upload';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

type ParseOptions = {
    fileFieldName?: string;
    maxFileSize?: number;
};

export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50mb

export const RequestUtils = {
    parseMultipart<Body extends object>(request: Request, options: ParseOptions = {}): Promise<Body> {
        const { fileFieldName = 'file' } = options;

        return new Promise((resolve, reject) => {
            const form = formidable({
                multiples: false,
                uploadDir: UPLOAD_CONFIG.DIRECTORY,
                maxFileSize: DEFAULT_MAX_FILE_SIZE,
            });

            form.parse(request, (err, fields, files) => {
                if (err) {
                    reject(err);
                    return;
                }

                const file = files[fileFieldName] as File | undefined;
                const body = { ...fields, ...(file ? { [fileFieldName]: file } : {}) };

                return resolve(body as Body);
            });
        });
    },
    uploadFile(file: File) {
        const imagePath = path.dirname(file.path);
        const imageName = generateFileName(file.name?.split('.').pop() || 'png');
        const fullPath = path.resolve(imagePath, imageName);
        fs.renameSync(file.path, fullPath);
        file.path = fullPath;
        return file;
    },
    usePaginationParams(request: Request) {
        const page = Number(request.params.page ?? '0');
        const perPage = Number(request.params.per_page ?? '10');
        const offset = page * perPage;

        return { page, perPage, offset };
    },
};

function generateFileName(extension: string) {
    const date = new Date();
    return `${date.getDate()}${date.getMonth()}${date.getFullYear()}-${date.getMinutes()}${date.getSeconds()}-${date.getTime()}.${extension}`;
}
