import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, MapPin, Smartphone, Wifi, Zap, CheckCircle } from 'lucide-react';
import { DesktopHeader } from '@/components/DesktopHeader';
import { useTranslation } from "react-i18next";

import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function Install() {
  const { t } = useTranslation();
  const { installable, installing, installed, install } = usePWAInstall();


  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DesktopHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("install.title")}
            </h2>
            
            <p className="text-md text-muted-foreground mb-6">
              {t("install.description")}
            </p>
          </div>

          {/* Installation Status */}
          {installed && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>{t("install.status.alreadyInstalled")}</strong> {t("install.status.alreadyInstalledDesc")}
              </AlertDescription>
            </Alert>
          )}

          {/* Install Button - Only show if browser supports installation */}
          {installable && !installed && (
            <Card className="mb-6 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Download className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("install.status.ready")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("install.status.readyDesc")}
                  </p>
                  
                  <Button 
                    size="lg" 
                    onClick={handleInstall}
                    disabled={installing}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {installing ? t("install.status.installing") : t("install.cta.installButton")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Installation Instructions */}
          {!installed && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {!installable ? t("install.manual.addToHome") : t("install.manual.title")}
                </CardTitle>
                <CardDescription>
                  {!installable 
                    ? t("install.manual.descNotInstallable")
                    : installable
                    ? t("install.manual.descFallback")
                    : t("install.manual.descGeneric")
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="browser-menu">
                    <AccordionTrigger className="text-left">
                      {t("install.instructions.androidTitle")}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">{t("install.instructions.chromeBrave")}</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>{t("install.instructions.steps.menuButton")}</li>
                            <li>{t("install.instructions.steps.addToHomeScreen")}</li>
                            <li>{t("install.instructions.steps.addConfirm")}</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">{t("install.instructions.firefox")}</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>{t("install.instructions.steps.menuButton")}</li>
                            <li>{t("install.instructions.steps.install")}</li>
                            <li>{t("install.instructions.steps.addConfirm")}</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">{t("install.instructions.edge")}</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>{t("install.instructions.steps.menuButton")}</li>
                            <li>{t("install.instructions.steps.addToPhone")}</li>
                            <li>{t("install.instructions.steps.addConfirm")}</li>
                          </ol>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="share-button">
                    <AccordionTrigger className="text-left">
                      {t("install.instructions.iosTitle")}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">{t("install.instructions.safari")}</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>{t("install.instructions.steps.shareButton")}</li>
                            <li>{t("install.instructions.steps.scrollAddToHome")}</li>
                            <li>{t("install.instructions.steps.addConfirm")}</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">{t("install.instructions.chromeBrave")}</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>{t("install.instructions.steps.shareButtonGeneric")}</li>
                            <li>{t("install.instructions.steps.tapAddToHome")}</li>
                            <li>{t("install.instructions.steps.addConfirm")}</li>
                          </ol>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  {t("install.benefits.performance.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t("install.benefits.performance.desc")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-500" />
                  {t("install.benefits.available.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t("install.benefits.available.desc")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  {t("install.benefits.native.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t("install.benefits.native.desc")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  {t("install.benefits.access.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t("install.benefits.access.desc")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}