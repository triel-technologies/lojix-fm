import { Controller, Post, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as path from 'path';

@Controller('')
export class AudioController {
  @Post('api/audio/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','dj')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => cb(null, '/music/autodj'),
      filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.mp3','.wav','.ogg',' .m4a'].includes(ext) ) cb(null, true);
      else cb(new Error('Invalid file type'), false);
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return { success: true, file: file.filename };
  }
}
