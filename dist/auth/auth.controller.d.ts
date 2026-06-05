import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminsService } from '../admins/admins.service';
export declare class AuthController {
    private readonly authService;
    private readonly adminsService;
    constructor(authService: AuthService, adminsService: AdminsService);
    loginPage(req: Request, res: Response): Promise<void>;
    login(login: string, password: string, phone: string, res: Response): Promise<void>;
    logout(res: Response): void;
    setLang(lang: string, req: Request, res: Response): void;
}
