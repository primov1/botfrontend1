import type { Request, Response } from 'express';
import { AdminsService } from '../admins/admins.service';
import { AuthService } from './auth.service';
import { UploadImageService } from '../upload/upload-image.service';
export declare class AdminProfileController {
    private readonly adminsService;
    private readonly authService;
    private readonly uploadImage;
    constructor(adminsService: AdminsService, authService: AuthService, uploadImage: UploadImageService);
    private currentLogin;
    show(req: Request, query: Record<string, string>, res: Response): Promise<void>;
    updateName(req: Request, name: string, res: Response): Promise<void>;
    updateCredentials(req: Request, currentPassword: string, newLogin: string, newPassword: string, confirmPassword: string, phone: string, res: Response): Promise<void>;
    uploadAvatar(_req: Request, file: Express.Multer.File, res: Response): Promise<void>;
    removeAvatar(req: Request, res: Response): Promise<void>;
}
