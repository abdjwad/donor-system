/**
 * navigator.clipboard غير متوفرة إطلاقاً بسياق غير آمن (HTTP عادي على IP بدون
 * شهادة TLS — حالة السيرفر الحالي)، فـ.writeText() بترمي خطأ فوراً بلا أي تفاعل
 * مرئي للمستخدم. هون fallback عبر textarea مخفي + execCommand('copy') يشتغل
 * بأي سياق، ومحاولة الـAPI الحديثة أولاً لو كانت متوفرة (HTTPS/localhost).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // نكمل على الـfallback تحت
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);

  return success;
}
