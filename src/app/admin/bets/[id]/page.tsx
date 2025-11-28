"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Save, Sliders, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import {
  STATUS_OPTIONS,
  SCOPE_OPTIONS,
  PLATFORM_TYPE_OPTIONS,
} from "@/lib/parameter-definitions";

interface Parameter {
  id: string;
  name: string;
}

interface Bet {
  id: string;
  name: string;
  company?: string;
  domain?: string;
  cnpj?: string;
  url?: string;
  logo?: string | null;
  coverImage?: string | null;
  region?: string;
  license?: string;
  status?: string;
  scope?: string;
  platformType?: string;
  parameters?: Parameter[];
}

export default function EditBetPage() {
  const params = useParams();
  const betId = params.id as string;
  const [bet, setBet] = useState<Bet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    domain: "",
    cnpj: "",
    url: "",
    region: "",
    license: "",
    status: "Funcionando",
    scope: "",
    platformType: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Verify admin session
  const { data: sessionData, loading: sessionLoading } = useFetch<{
    valid: boolean;
  }>("/api/auth/verify-admin-session", {
    immediate: true,
    showToast: false,
    onSuccess: (data) => {
      if (data && !data.valid) {
        console.log("Admin session invalid, redirecting to login");
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: "Você precisa estar logado como administrador para acessar esta página",
        });
        router.push("/admin/login");
      }
    },
    onError: () => {
      console.log("Admin session check failed, redirecting to login");
      router.push("/admin/login");
    },
  });

  useEffect(() => {
    if (!sessionLoading && sessionData?.valid) {
      fetchBet();
    }
  }, [betId, sessionLoading, sessionData]);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bets/${betId}`);
      const data = await response.json();

      if (data.success) {
        setBet(data.bet);
        setFormData({
          name: data.bet.name || "",
          company: data.bet.company || "",
          domain: data.bet.domain || "",
          cnpj: data.bet.cnpj || "",
          url: data.bet.url || "",
          region: data.bet.region || "",
          license: data.bet.license || "",
          status: data.bet.status || "Funcionando",
          scope: data.bet.scope || "",
          platformType: data.bet.platformType || "",
        });
        // Set image previews
        if (data.bet.logo) {
          setLogoPreview(data.bet.logo);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome é obrigatório",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/bets/${betId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Casa de apostas atualizada com sucesso",
        });
        router.push("/admin/bets");
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error("Error updating bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Falha ao atualizar casa de apostas",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: "logo" | "cover", file: File) => {
    const isLogo = type === "logo";
    const setUploading = setUploadingLogo;
    const setPreview = setLogoPreview;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Tipo de arquivo inválido. Use JPEG, PNG ou WebP",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Arquivo muito grande. Tamanho máximo: 5MB",
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch(`/api/admin/bets/${betId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Logo enviado com sucesso",
        });
        setPreview(data.path);
        // Update bet state
        if (bet) {
          setBet({
            ...bet,
            logo: data.path,
          });
        }
      } else {
        const errorMsg = data.error || "Falha ao enviar imagem";
        if (errorMsg.includes("Admin access required")) {
          toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: "Você precisa estar logado como administrador. Por favor, faça login novamente.",
          });
          router.push("/admin/login");
        } else {
          throw new Error(errorMsg);
        }
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao enviar imagem";
      if (errorMessage.includes("Admin access required")) {
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: "Você precisa estar logado como administrador. Por favor, faça login novamente.",
        });
        router.push("/admin/login");
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMessage,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async (type: "logo" | "cover") => {
    const setUploading = setUploadingLogo;
    const setPreview = setLogoPreview;

    try {
      setUploading(true);

      const response = await fetch(
        `/api/admin/bets/${betId}/upload?type=${type}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Logo removido com sucesso",
        });
        setPreview(null);
        // Update bet state
        if (bet) {
          setBet({
            ...bet,
            logo: null,
          });
        }
      } else {
        throw new Error(data.error || "Falha ao remover imagem");
      }
    } catch (error: unknown) {
      console.error("Error removing image:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Falha ao remover imagem",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (type: "logo" | "cover", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(type, file);
    }
    // Reset input
    e.target.value = "";
  };

  // Format URL for iframe (ensure it has protocol)
  const getIframeUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;
    // If URL doesn't start with http:// or https://, add https://
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-slate-700">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link href="/admin/bets">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                Editar Casa de Apostas
              </h1>
              <p className="text-slate-600 mt-1">
                Atualize as informações básicas
              </p>
            </div>
          </div>
          <Link href={`/admin/bets/${betId}/parameters`}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl">
              <Sliders className="w-4 h-4 mr-2" />
              Gerenciar Parâmetros
            </Button>
          </Link>
        </div>

        {/* Images Section - Iframe and Logo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Iframe Section - Takes 2/3 on large screens */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 text-xl">Visualização do Website</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full h-64 md:h-80 lg:h-96 xl:h-[500px] bg-slate-100 overflow-hidden rounded-b-2xl">
                {getIframeUrl(formData.url) ? (
                  <iframe
                    src={getIframeUrl(formData.url) || ""}
                    className="w-full h-full border-0"
                    title="Casa de Apostas Website"
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                    <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                    <span className="text-slate-600 text-sm text-center px-4">
                      Adicione uma URL no campo "Website" para visualizar o site aqui
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logo Section - Takes 1/3 on large screens */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900 text-xl">Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview ? (
                <>
                  <div className="relative w-full aspect-square max-w-xs mx-auto bg-slate-100 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg">
                    <Image
                      src={logoPreview}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleFileSelect("logo", e)}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={uploadingLogo}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar
                          </Button>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleImageRemove("logo")}
                          disabled={uploadingLogo}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs text-center">
                    Logo será exibido em formato circular. Recomendado: 400x400px
                  </p>
                </>
              ) : (
                <>
                  <div className="relative w-full aspect-square max-w-xs mx-auto bg-slate-100 rounded-full overflow-hidden border-4 border-dashed border-slate-300 flex items-center justify-center">
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200/50 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleFileSelect("logo", e)}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                      <span className="text-slate-600 text-sm text-center px-4">
                        {uploadingLogo ? "Enviando..." : "Clique para fazer upload"}
                      </span>
                    </label>
                  </div>
                  <div className="text-center">
                    <Label className="text-slate-700 mb-2 block">Logo (Arredondado)</Label>
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleFileSelect("logo", e)}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl w-full"
                        disabled={uploadingLogo}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingLogo ? "Enviando..." : "Fazer upload do logo"}
                      </Button>
                    </label>
                    <p className="text-slate-500 text-xs mt-2">
                      Recomendado: 400x400px
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {/* Basic Info Card */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">
                    Nome da Casa *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Pixbet"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-700">
                    Empresa
                  </Label>
                  <Input
                    id="company"
                    placeholder="Ex: PIXBET SOLUÇÕES TECNOLÓGICAS LTDA"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-slate-700">
                    Domínio
                  </Label>
                  <Input
                    id="domain"
                    placeholder="pix.bet.br"
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-slate-700">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="text-slate-700">
                    Website
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://exemplo.com"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classification Card */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-700">
                    Status
                  </Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border-slate-200 text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope" className="text-slate-700">
                    Abrangência
                  </Label>
                  <select
                    id="scope"
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({ ...formData, scope: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border-slate-200 text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione...</option>
                    {SCOPE_OPTIONS.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformType" className="text-slate-700">
                    Tipo de Plataforma
                  </Label>
                  <select
                    id="platformType"
                    value={formData.platformType}
                    onChange={(e) =>
                      setFormData({ ...formData, platformType: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border-slate-200 text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione...</option>
                    {PLATFORM_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="text-slate-700">
                    Região
                  </Label>
                  <Input
                    id="region"
                    placeholder="Ex: Nacional, São Paulo, etc."
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license" className="text-slate-700">
                    Licença
                  </Label>
                  <Input
                    id="license"
                    placeholder="Ex: Licença SECAP #12345"
                    value={formData.license}
                    onChange={(e) =>
                      setFormData({ ...formData, license: e.target.value })
                    }
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Informações Básicas"}
            </Button>
            <Link href={`/admin/bets/${betId}/parameters`} className="flex-1">
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl"
              >
                <Sliders className="w-4 h-4 mr-2" />
                Gerenciar Parâmetros ({bet?.parameters?.length || 0})
              </Button>
            </Link>
            <Link href="/admin/bets">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

