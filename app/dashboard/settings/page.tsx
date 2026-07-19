'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Key,
  Check,
  Copy,
  Plus,
  Trash2,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  mockNotificationPrefs,
  mockApiKeys,
  mockSubscription,
} from '@/lib/mock-data';
import { userService } from '@/services/api.service';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

const tabItems = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'api-keys', label: 'API Keys', icon: Key },
];

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Manage your account, preferences, and security.
        </p>

        <Tabs defaultValue="profile" className="w-full">
          {/* Tab list - scrollable on mobile */}
          <div className="mb-6 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="flex justify-end gap-2">{footer}</CardFooter>}
    </Card>
  );
}

function ProfileTab() {
  const [firstName, setFirstName] = React.useState('Jane');
  const [lastName, setLastName] = React.useState('Doe');
  const [email, setEmail] = React.useState('jane@bhanutron.app');
  const [role, setRole] = React.useState('Product Manager');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    userService.getProfile().then((profile) => {
      if (cancelled) return;
      if (profile.firstName) setFirstName(profile.firstName);
      if (profile.lastName) setLastName(profile.lastName);
      if (profile.email) setEmail(profile.email);
      if (profile.role) setRole(profile.role);
    }).catch(() => {
      // Use defaults if API unavailable
    });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.update({
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        role,
      });
      toast.success('Profile updated', {
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      toast.error('Failed to update profile', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <SectionCard
      title="Profile"
      description="Update your personal information and avatar."
      footer={
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Upload new
            </Button>
            <Button variant="ghost" size="sm">
              Remove
            </Button>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
      </div>
    </SectionCard>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <SectionCard
      title="Appearance"
      description="Customize how BhanuTron looks on your device."
    >
      <div className="space-y-6">
        <div>
          <Label className="mb-3 block">Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                aria-pressed={mounted && theme === t.value}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                  mounted && theme === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                )}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="compact-mode">Compact mode</Label>
            <p className="text-xs text-muted-foreground">
              Reduce spacing for denser information display
            </p>
          </div>
          <Switch id="compact-mode" aria-labelledby="compact-mode" />
        </div>
      </div>
    </SectionCard>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = React.useState(mockNotificationPrefs);

  const toggle = (id: string) => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <SectionCard
      title="Notifications"
      description="Choose what you want to be notified about."
      footer={<Button size="sm">Save preferences</Button>}
    >
      <div className="space-y-1">
        {prefs.map((pref, i) => (
          <React.Fragment key={pref.id}>
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <p className="text-sm font-medium">{pref.label}</p>
                <p className="text-xs text-muted-foreground">
                  {pref.description}
                </p>
              </div>
              <Switch
                checked={pref.enabled}
                onCheckedChange={() => toggle(pref.id)}
                aria-label={pref.label}
              />
            </div>
            {i < prefs.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
    </SectionCard>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionCard
        title="Password"
        description="Change your account password."
        footer={<Button size="sm">Update password</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account."
        footer={
          <>
            <Button variant="outline" size="sm">
              Disable
            </Button>
            <Button size="sm">Configure</Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">2FA is enabled</p>
            <p className="text-xs text-muted-foreground">
              Your account is protected with an authenticator app.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Active Sessions"
        description="Manage devices currently signed in to your account."
      >
        <div className="space-y-3">
          {[
            { device: 'MacBook Pro · Chrome', location: 'San Francisco, CA', current: true },
            { device: 'iPhone 15 · Safari', location: 'San Francisco, CA', current: false },
            { device: 'Windows PC · Edge', location: 'New York, NY', current: false },
          ].map((session) => (
            <React.Fragment key={session.device}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {session.device}
                    {session.current && (
                      <Badge variant="success" className="ml-2">
                        Current
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.location}
                  </p>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive">
                    Revoke
                  </Button>
                )}
              </div>
              <Separator />
            </React.Fragment>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {mockSubscription.plan}
                </span>
                <span className="text-muted-foreground">
                  {mockSubscription.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Renews on {mockSubscription.renewsOn}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <Separator className="my-4" />
          <ul className="space-y-2">
            {mockSubscription.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm">
            Cancel subscription
          </Button>
          <Button size="sm">Change plan</Button>
        </CardFooter>
      </Card>

      <SectionCard
        title="Payment Method"
        description="Manage your billing information."
        footer={<Button variant="outline" size="sm">Update card</Button>}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-muted-foreground">Expires 09/2027</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Billing History"
        description="Download your past invoices."
      >
        <div className="space-y-1">
          {[
            { date: 'Jul 12, 2025', amount: '$24.00', id: 'INV-2025-07' },
            { date: 'Jun 12, 2025', amount: '$24.00', id: 'INV-2025-06' },
            { date: 'May 12, 2025', amount: '$24.00', id: 'INV-2025-05' },
          ].map((invoice, i) => (
            <React.Fragment key={invoice.id}>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{invoice.date}</p>
                  <p className="text-xs text-muted-foreground">{invoice.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{invoice.amount}</span>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
              {i < 2 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ApiKeysTab() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy', {
        description: 'Clipboard access was denied.',
      });
    }
  };

  return (
    <SectionCard
      title="API Keys"
      description="Manage keys for programmatic access to the BhanuTron API."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
          <div>
            <p className="text-sm font-medium">API Keys (Coming Soon)</p>
            <p className="text-xs text-muted-foreground">
              Full API access will be available in a future release.
            </p>
          </div>
          <Badge variant="warning">Soon</Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          {mockApiKeys.map((key) => (
            <div
              key={key.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{key.name}</p>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  btron_{'•'.repeat(20)}{key.id}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {key.createdOn} · Last used {key.lastUsed}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(key.id)}
                >
                  {copiedId === key.id ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" disabled className="w-full">
          <Plus className="mr-1.5 h-4 w-4" />
          Generate new key
        </Button>
      </div>
    </SectionCard>
  );
}
