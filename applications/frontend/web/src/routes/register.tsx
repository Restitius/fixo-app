// Register page — customer registration form.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, Lock, Check } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const title = "Create Account — Fixo";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Phone number too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  privacy_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy policy",
  }),
});

type RegisterValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title }, { name: "description", content: "Create your Fixo account." }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register: registerCustomer } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting, errors }, watch } =
    useForm<RegisterValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
        full_name: "",
        phone: "",
        email: "",
        password: "",
        terms_accepted: false,
        privacy_accepted: false,
      },
    });

  const passwordValue = watch("password", "");

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerCustomer(values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join Fixo and get access to verified handypersons
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="full_name" placeholder="Jane Doe" className="pl-10" {...register("full_name")} />
            </div>
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="+254 700 000 000" className="pl-10" {...register("phone")} />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

                    <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="At least 8 characters" className="pl-10" {...register("password")} />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            {passwordValue && (
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <Check className={passwordValue.length >= 8 ? "h-3 w-3 text-success" : "h-3 w-3 text-muted-foreground"} />
                  At least 8 characters
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox id="terms_accepted" {...register("terms_accepted")} className="mt-1" />
              <Label htmlFor="terms_accepted" className="font-normal">
                I agree to the <a href="#" className="text-primary">Terms and Conditions</a>
              </Label>
            </div>
            {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted.message}</p>}

            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox id="privacy_accepted" {...register("privacy_accepted")} className="mt-1" />
              <Label htmlFor="privacy_accepted" className="font-normal">
                I agree to the <a href="#" className="text-primary">Privacy Policy</a>
              </Label>
            </div>
            {errors.privacy_accepted && <p className="text-xs text-destructive">{errors.privacy_accepted.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

