import formidable, { Fields, File, Files } from 'formidable';
import { UPLOAD_CONFIG } from '@app/config/upload';
import fs from 'fs';
import { Request } from 'express';
import path from 'path';

type ParseOptions = {
    fileFieldName?: string;
};

const DEFAULT_PARSE_OPTIONS: ParseOptions = {
    fileFieldName: 'file',
};

export const RequestUtils = {
    parseMultipart<Body extends object>(request: Request, options?: ParseOptions): Promise<Body> {
        options = Object.assign(DEFAULT_PARSE_OPTIONS, options) as ParseOptions;
        const { fileFieldName = 'file' } = options;

        return new Promise((resolve, reject) => {
            const form = formidable({ multiples: false, uploadDir: UPLOAD_CONFIG.DIRECTORY });

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
};

function generateFileName(extension: string) {
    const date = new Date();
    return `${date.getDate()}${date.getMonth()}${date.getFullYear()}-${date.getMinutes()}${date.getSeconds()}-${date.getTime()}.${extension}`;
}
