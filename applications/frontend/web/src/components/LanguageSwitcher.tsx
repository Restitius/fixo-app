import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { LANGUAGE_NAMES, setLanguage, type LanguageCode } from "@/lib/language";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("profile");
  const { updateProfile } = useAuth();
  const current = i18n.language as LanguageCode;

  async function handleChange(code: string) {
    const previous = i18n.language;
    try {
      await setLanguage(i18n, code as LanguageCode);
      await updateProfile({ preferred_language: code });
    } catch {
      await setLanguage(i18n, previous as LanguageCode);
      toast.error(t("languageSaveError"));
    }
  }

  return (
    <Select value={current} onValueChange={(v) => void handleChange(v)}>
      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((code) => (
          <SelectItem key={code} value={code}>
            {LANGUAGE_NAMES[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
