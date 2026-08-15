import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

// طلبات ما بدنا نزعجه فيها بتوست عام — عندها معالجة خاصة بمكانها (نموذج تسجيل
// دخول مثلاً بيعرض رسالة الخطأ جنب الحقل نفسه)، أو حالات صامتة بالتصميم
// (polling/فحص دوري ما لازم يقاطع المستخدم بتوست في كل مرة يفشل)
const SILENT_URL_PATTERNS = [/\/auth\/login$/, /\/auth\/register$/];

function extractMessage(err: HttpErrorResponse): string {
  const body = err.error;

  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
    // شكل استجابة تحقق Laravel الافتراضي: { errors: { field: ["رسالة"] } }
    if (body.errors && typeof body.errors === 'object') {
      const firstField = Object.values(body.errors)[0];
      if (Array.isArray(firstField) && firstField.length) {
        return String(firstField[0]);
      }
    }
  }

  if (err.status === 0) {
    return 'تعذّر الاتصال بالخادم — تحقّق من اتصالك بالإنترنت';
  }

  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isSilent = SILENT_URL_PATTERNS.some((p) => p.test(req.url));
      if (!isSilent) {
        toast.error(extractMessage(err));
      }
      return throwError(() => err);
    })
  );
};
