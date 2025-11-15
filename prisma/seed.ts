import { PrismaClient } from "./generated/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Betting houses data from Excel
const bettingHouses = [
  // 7MBR LTDA
  { company: "7MBR LTDA", domain: "vert.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Casino" },
  { company: "7MBR LTDA", domain: "cgg.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Casino" },
  { company: "7MBR LTDA", domain: "fanbit.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Casino" },
  
  // A2FBR LTDA
  { company: "A2FBR LTDA", domain: "pinnacle.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  { company: "A2FBR LTDA", domain: "matchbook.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  { company: "A2FBR LTDA", domain: "betespecial.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  { company: "A2FBR LTDA", domain: "bolsadeaposta.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  { company: "A2FBR LTDA", domain: "fulltbet.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  { company: "A2FBR LTDA", domain: "betbra.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  
  // ALFA ENTRETENIMENTO S.A
  { company: "ALFA ENTRETENIMENTO S.A", domain: "alfa.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  
  // ANA GAMING BRASIL S.A
  { company: "ANA GAMING BRASIL S.A", domain: "7k.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  { company: "ANA GAMING BRASIL S.A", domain: "cassino.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "ANA GAMING BRASIL S.A", domain: "vera.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  
  // APOLLO OPERATIONS LTDA
  { company: "APOLLO OPERATIONS LTDA", domain: "kto.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  
  // APOSTA GANHA LOTERIAS LTDA
  { company: "APOSTA GANHA LOTERIAS LTDA", domain: "apostaganha.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  
  // B3T4 INTERNATIONAL GROUP LTDA
  { company: "B3T4 INTERNATIONAL GROUP LTDA", domain: "bet4.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "B3T4 INTERNATIONAL GROUP LTDA", domain: "aposta.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "B3T4 INTERNATIONAL GROUP LTDA", domain: "fazo.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  
  // BELL VENTURES DIGITAL LTDA
  { company: "BELL VENTURES DIGITAL LTDA", domain: "bandbet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  
  // BET.BET SOLUÇÕES TECNOLÓGICAS S.A
  { company: "BET.BET SOLUÇÕES TECNOLÓGICAS S.A", domain: "betpontobet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BET.BET SOLUÇÕES TECNOLÓGICAS S.A", domain: "donald.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  
  // BETBOOM LTDA
  { company: "BETBOOM LTDA", domain: "betboom.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Casino" },
  
  // BETBR LOTERIAS LTDA
  { company: "BETBR LOTERIAS LTDA", domain: "apostou.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BETBR LOTERIAS LTDA", domain: "b1bet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BETBR LOTERIAS LTDA", domain: "brbet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  
  // BETESPORTE APOSTAS ON LINE LTDA
  { company: "BETESPORTE APOSTAS ON LINE LTDA", domain: "betesporte.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "BETESPORTE APOSTAS ON LINE LTDA", domain: "lancedesorte.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  
  // BETFAIR BRASIL LTDA
  { company: "BETFAIR BRASIL LTDA", domain: "betfair.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  
  // BETSPEED LTDA
  { company: "BETSPEED LTDA", domain: "tiger.bet.br", status: "Fora do ar" },
  { company: "BETSPEED LTDA", domain: "pq777.bet.br", status: "Fora do ar" },
  { company: "BETSPEED LTDA", domain: "5g.bet.br", status: "Fora do ar" },
  
  // BIG BRAZIL TECNOLOGIA E LOTERIA S.A
  { company: "BIG BRAZIL TECNOLOGIA E LOTERIA S.A", domain: "big.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BIG BRAZIL TECNOLOGIA E LOTERIA S.A", domain: "apostar.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BIG BRAZIL TECNOLOGIA E LOTERIA S.A", domain: "caesars.bet.br", status: "Fora do ar" },
  
  // BLAC JOGOS LTDA
  { company: "BLAC JOGOS LTDA", domain: "sporty.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Sports" },
  
  // BLOW MARKETPLACE LTDA
  { company: "BLOW MARKETPLACE LTDA", domain: "bravo.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  { company: "BLOW MARKETPLACE LTDA", domain: "tradicional.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "BLOW MARKETPLACE LTDA", domain: "apostatudo.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  
  // BOA LION S.A
  { company: "BOA LION S.A", domain: "betmgm.bet.br", status: "Redirect Pro Principal", scope: "Mundial" },
  { company: "BOA LION S.A", domain: "mgm.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Casino" },
  
  // BPX BETS SPORTS GROUP LTDA
  { company: "BPX BETS SPORTS GROUP LTDA", domain: "vaidebet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  { company: "BPX BETS SPORTS GROUP LTDA", domain: "betpix365.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "BPX BETS SPORTS GROUP LTDA", domain: "obabet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  
  // BRILLIANT GAMING LTDA
  { company: "BRILLIANT GAMING LTDA", domain: "afun.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Ambos" },
  { company: "BRILLIANT GAMING LTDA", domain: "ai.bet.br", status: "Fora do ar", scope: "Mundial" },
  { company: "BRILLIANT GAMING LTDA", domain: "6z.bet.br", status: "Funcionando", scope: "Mundial", platformType: "Ambos" },
  
  // CAIXA LOTERIAS
  { company: "CAIXA LOTERIAS", domain: "betcaixa.bet.br", status: "Fora do ar", scope: "Brasil" },
  { company: "CAIXA LOTERIAS", domain: "megabet.bet.br", status: "Fora do ar", scope: "Brasil" },
  { company: "CAIXA LOTERIAS", domain: "xbetcaixa.bet.br", status: "Fora do ar", scope: "Brasil" },
  
  // CDA GAMING LTDA
  { company: "CDA GAMING LTDA", domain: "casadeapostas.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "CDA GAMING LTDA", domain: "betsul.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "CDA GAMING LTDA", domain: "jogoonline.bet.br", status: "Fora do ar", scope: "Brasil" },
  
  // More companies...
  { company: "DEFY LTDA", domain: "1xbet.bet.br", status: "Fora do ar", scope: "Mundial" },
  { company: "DIGIPLUS BRAZIL INTERACTIVE LTDA", domain: "arenaplus.bet.br", status: "Fora do ar", scope: "Brasil" },
  { company: "DIGIPLUS BRAZIL INTERACTIVE LTDA", domain: "gameplus.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "DIGIPLUS BRAZIL INTERACTIVE LTDA", domain: "bingoplus.bet.br", status: "Fora do ar", scope: "Brasil" },
  { company: "EA ENTRETENIMENTO E ESPORTES LTDA", domain: "bateu.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "EA ENTRETENIMENTO E ESPORTES LTDA", domain: "esportiva.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  { company: "EB INTERMEDIACOES E JOGOS S.A", domain: "estrelabet.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "EB INTERMEDIACOES E JOGOS S.A", domain: "vupi.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "ENSEADA SERVIÇOS E TECNOLOGIA LTDA", domain: "kbet.bet.br", status: "Fora do ar" },
  { company: "ESPORTES GAMING BRASIL LTDA", domain: "esportesdasorte.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "ESPORTES GAMING BRASIL LTDA", domain: "ona.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "ESPORTES GAMING BRASIL LTDA", domain: "lottu.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Ambos" },
  { company: "F12 DO BRASIL JOGOS ELETRONICOS LTDA", domain: "f12.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Casino" },
  { company: "F12 DO BRASIL JOGOS ELETRONICOS LTDA", domain: "luva.bet.br", status: "Funcionando", scope: "Brasil", platformType: "Sports" },
  { company: "F12 DO BRASIL JOGOS ELETRONICOS LTDA", domain: "brasil.bet.br", status: "Fora do ar", scope: "Brasil" },
  { company: "FAST GAMING S.A", domain: "betfast.bet.br", status: "Funcionando" },
  { company: "FAST GAMING S.A", domain: "faz1.bet.br", status: "Funcionando" },
  { company: "FAST GAMING S.A", domain: "tivo.bet.br", status: "Funcionando" },
  { company: "FOGGO ENTERTAINMENT LTDA", domain: "blaze.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "FOGGO ENTERTAINMENT LTDA", domain: "jonbet.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "FUTURAS APOSTAS LTDA", domain: "brazino777.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GALERA GAMING JOGOS ELETRONICOS S.A", domain: "galera.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "ijogo.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "fogo777.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "p9.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "9f.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "6r.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GAMEWIZ BRASIL LTDA", domain: "betapp.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "GORILLAS GROUP DO BRASIL LTDA", domain: "betgorillas.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "GORILLAS GROUP DO BRASIL LTDA", domain: "betbuffalos.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "GORILLAS GROUP DO BRASIL LTDA", domain: "betfalcons.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "H2 LICENSED LTDA", domain: "seu.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "H2 LICENSED LTDA", domain: "h2.bet.br", status: "Funcionando", scope: "Brasil" },
  { company: "HILGARDO GAMING LTDA", domain: "a247.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "HIPER BET TECNOLOGIA LTDA", domain: "hiper.bet.br", status: "Funcionando" },
  { company: "HS DO BRASIL LTDA", domain: "bet365.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "JOGO PRINCIPAL LTDA", domain: "ginga.bet.br", status: "Funcionando" },
  { company: "JOGO PRINCIPAL LTDA", domain: "qg.bet.br", status: "Funcionando" },
  { company: "JOGO PRINCIPAL LTDA", domain: "vivasorte.bet.br", status: "Funcionando" },
  { company: "KAIZEN GAMING BRASIL LTDA", domain: "betano.bet.br", status: "Funcionando", scope: "Mundial" },
  { company: "LAGUNA SERVIÇOS E TECNOLOGIA LTDA", domain: "nossa.bet.br", status: "Funcionando" },
  { company: "LBBR APOSTAS DE QUOTA FIXA LIMITADA", domain: "luck.bet.br", status: "Funcionando" },
  { company: "LBBR APOSTAS DE QUOTA FIXA LIMITADA", domain: "1pra1.bet.br", status: "Funcionando" },
  { company: "LBBR APOSTAS DE QUOTA FIXA LIMITADA", domain: "start.bet.br", status: "Funcionando" },
  { company: "LEVANTE BRASIL LTDA", domain: "sorteonline.bet.br", status: "Funcionando" },
  { company: "LEVANTE BRASIL LTDA", domain: "lottoland.bet.br", status: "Funcionando" },
  { company: "LINDAU GAMING BRASIL S.A.", domain: "spin.bet.br", status: "Funcionando" },
  { company: "LINDAU GAMING BRASIL S.A.", domain: "oleybet.bet.br", status: "Funcionando" },
  { company: "LINDAU GAMING BRASIL S.A.", domain: "betpark.bet.br", status: "Funcionando" },
  { company: "LOGAME DO BRASIL LTDA", domain: "lider.bet.br", status: "Funcionando" },
  { company: "LOGAME DO BRASIL LTDA", domain: "geralbet.bet.br", status: "Funcionando" },
  { company: "LOGAME DO BRASIL LTDA", domain: "b2x.bet.br", status: "Funcionando" },
  { company: "LUCKY GAMING LTDA", domain: "4win.bet.br", status: "Funcionando" },
  { company: "LUCKY GAMING LTDA", domain: "4play.bet.br", status: "Funcionando" },
  { company: "LUCKY GAMING LTDA", domain: "pagol.bet.br", status: "Funcionando" },
  { company: "MERIDIAN GAMING BRASIL SPE LTDA", domain: "meridianbet.bet.br", status: "Funcionando" },
  { company: "MERIDIAN GAMING BRASIL SPE LTDA", domain: "pin.bet.br", status: "Fora do ar" },
  { company: "MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA", domain: "reidopitaco.bet.br", status: "Funcionando" },
  { company: "MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA", domain: "pitaco.bet.br", status: "Redirect Pro Principal" },
  { company: "MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA", domain: "rdp.bet.br", status: "Redirect Pro Principal" },
  { company: "NEXUS INTERNATIONAL LTDA", domain: "megaposta.bet.br", status: "Fora do ar" },
  { company: "NSX BRASIL S.A", domain: "betnacional.bet.br", status: "Funcionando" },
  { company: "NVBT GAMING LTDA", domain: "novibet.bet.br", status: "Funcionando" },
  { company: "OIG GAMING BRAZIL LTDA", domain: "ice.bet.br", status: "Funcionando" },
  { company: "OIG GAMING BRAZIL LTDA", domain: "7games.bet.br", status: "Funcionando" },
  { company: "OIG GAMING BRAZIL LTDA", domain: "betao.bet.br", status: "Funcionando" },
  { company: "OIG GAMING BRAZIL LTDA", domain: "r7.bet.br", status: "Funcionando" },
  { company: "OLAVIR LTDA", domain: "rivalo.bet.br", status: "Funcionando" },
  { company: "PIX NA HORA", domain: "aposta1.bet.br", status: "Funcionando" },
  { company: "PIX NA HORA", domain: "apostamax.bet.br", status: "Funcionando" },
  { company: "PIX NA HORA", domain: "aviao.bet.br", status: "Fora do ar" },
  
  // PIXBET - The one with complete data in Excel
  {
    company: "PIXBET SOLUÇÕES TECNOLÓGICAS LTDA",
    domain: "pix.bet.br",
    name: "Pixbet",
    status: "Funcionando",
    scope: "Brasil",
    platformType: "Casino",
  },
  {
    company: "PIXBET SOLUÇÕES TECNOLÓGICAS LTDA",
    domain: "fla.bet.br",
    name: "Flambet (Pixbet)",
    status: "Funcionando",
    scope: "Brasil",
    platformType: "Casino",
  },
  { company: "PIXBET SOLUÇÕES TECNOLÓGICAS LTDA", domain: "betdasorte.bet.br", status: "Funcionando" },
  
  { company: "REALS BRASIL LTDA", domain: "reals.bet.br", status: "Funcionando" },
  { company: "REALS BRASIL LTDA", domain: "ux.bet.br", status: "Funcionando" },
  { company: "REALS BRASIL LTDA", domain: "bingo.bet.br", status: "Fora do ar" },
  { company: "RESPONSA GAMMING BRASIL LIMITADA", domain: "jogalimpo.bet.br", status: "Anunciado pra entrar no Ar" },
  { company: "RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS", domain: "multi.bet.br", status: "Funcionando" },
  { company: "RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS", domain: "rico.bet.br", status: "Funcionando" },
  { company: "RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS", domain: "brx.bet.br", status: "Funcionando" },
  { company: "SABIA ADMINISTRACAO LTDA", domain: "br4.bet.br", status: "Funcionando" },
  { company: "SABIA ADMINISTRACAO LTDA", domain: "goldebet.bet.br", status: "Funcionando" },
  { company: "SABIA ADMINISTRACAO LTDA", domain: "lotogreen.bet.br", status: "Funcionando" },
  { company: "SC OPERATING BRAZIL LTDA", domain: "vbet.bet.br", status: "Funcionando" },
  { company: "SC OPERATING BRAZIL LTDA", domain: "vivaro.bet.br", status: "Fora do ar" },
  { company: "SEGURO BET LTDA", domain: "seguro.bet.br", status: "Funcionando" },
  { company: "SEGURO BET LTDA", domain: "kingpanda.bet.br", status: "Funcionando" },
  { company: "SELECT OPERATIONS LTDA", domain: "betvip.bet.br", status: "Funcionando" },
  { company: "SELECT OPERATIONS LTDA", domain: "mmabet.bet.br", status: "Funcionando" },
  { company: "SELECT OPERATIONS LTDA", domain: "papigames.bet.br", status: "Funcionando" },
  { company: "SEVENX GAMING LTDA", domain: "bullsbet.bet.br", status: "Funcionando" },
  { company: "SEVENX GAMING LTDA", domain: "jogao.bet.br", status: "Funcionando" },
  { company: "SEVENX GAMING LTDA", domain: "jogos.bet.br", status: "Fora do ar" },
  { company: "SIMULCASTING BRASIL SOM E IMAGEM S.A", domain: "betsson.bet.br", status: "Funcionando" },
  { company: "SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.", domain: "mcgames.bet.br", status: "Funcionando" },
  { company: "SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.", domain: "play.bet.br", status: "Funcionando" },
  { company: "SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.", domain: "montecarlos.bet.br", status: "Fora do ar" },
  { company: "SKILL ON NET LTDA", domain: "bacanaplay.bet.br", status: "Funcionando" },
  { company: "SKILL ON NET LTDA", domain: "playuzu.bet.br", status: "Funcionando" },
  { company: "SORTENABET GAMING BRASIL S.A.", domain: "sortenabet.bet.br", status: "Funcionando" },
  { company: "SORTENABET GAMING BRASIL S.A.", domain: "betou.bet.br", status: "Funcionando" },
  { company: "SORTENABET GAMING BRASIL S.A.", domain: "betfusion.bet.br", status: "Funcionando" },
  { company: "SPORTVIP GROUP INTERNATIONAL APOSTAS", domain: "esportivavip.bet.br", status: "Funcionando" },
  { company: "SPORTVIP GROUP INTERNATIONAL APOSTAS", domain: "cbesportes.bet.br", status: "Funcionando" },
  { company: "SPORTVIP GROUP INTERNATIONAL APOSTAS", domain: "donosdabola.bet.br", status: "Funcionando" },
  { company: "SPRBT INTERACTIVE BRASIL LTDA", domain: "superbet.bet.br", status: "Funcionando" },
  { company: "SPRBT INTERACTIVE BRASIL LTDA", domain: "magicjackpot.bet.br", status: "Fora do ar" },
  { company: "SPRBT INTERACTIVE BRASIL LTDA", domain: "super.bet.br", status: "Fora do ar" },
  { company: "STAKE BRAZIL LTDA", domain: "stake.bet.br", status: "Funcionando" },
  { company: "SUPREMA BET LTDA", domain: "suprema.bet.br", status: "Funcionando" },
  { company: "SUPREMA BET LTDA", domain: "maxima.bet.br", status: "Funcionando" },
  { company: "SUPREMA BET LTDA", domain: "ultra.bet.br", status: "Funcionando" },
  { company: "TQJ-PAR PARTICIPAÇÕES SOCIETÁRIAS S.A", domain: "milhao.bet.br", status: "Funcionando" },
  { company: "TQJ-PAR PARTICIPAÇÕES SOCIETÁRIAS S.A", domain: "bau.bet.br", status: "Fora do ar" },
  { company: "TRACK GAMING BRASIL LTDA", domain: "betwarrior.bet.br", status: "Funcionando" },
  { company: "UPBET BRASIL LTDA", domain: "up.bet.br", status: "Funcionando" },
  { company: "UPBET BRASIL LTDA", domain: "9d.bet.br", status: "Funcionando" },
  { company: "UPBET BRASIL LTDA", domain: "wjcasino.bet.br", status: "Funcionando" },
  { company: "VANGUARD ENTRETENIMENTO BRASIL LTDA", domain: "esporte365.bet.br", status: "Funcionando" },
  { company: "VANGUARD ENTRETENIMENTO BRASIL LTDA", domain: "betaki.bet.br", status: "Funcionando" },
  { company: "VANGUARD ENTRETENIMENTO BRASIL LTDA", domain: "jogodeouro.bet.br", status: "Funcionando" },
  { company: "VENTMEAR BRASIL S.A.", domain: "sportingbet.bet.br", status: "Funcionando" },
  { company: "VENTMEAR BRASIL S.A.", domain: "betboo.bet.br", status: "Funcionando" },
  { company: "Versus Brasil Ltda", domain: "versus.bet.br", status: "Funcionando" },
  { company: "WORLD SPORTS TECHNOLOGY DO BRASIL S.A", domain: "betcopa.bet.br", status: "Fora do ar" },
  { company: "WORLD SPORTS TECHNOLOGY DO BRASIL S.A", domain: "brasildasorte.bet.br", status: "Funcionando" },
  { company: "WORLD SPORTS TECHNOLOGY DO BRASIL S.A", domain: "fybet.bet.br", status: "Fora do ar" },
  { company: "ZEROUMBET PLATAFORMA DIGITAL LTDA", domain: "zeroum.bet.br", status: "Fora do ar" },
  { company: "ZEROUMBET PLATAFORMA DIGITAL LTDA", domain: "energia.bet.br", status: "Funcionando" },
  { company: "ZEROUMBET PLATAFORMA DIGITAL LTDA", domain: "sportvip.bet.br", status: "Fora do ar" },
  { company: "ZONA DE JOGO NEGÓCIOS E PARTICIPAÇÕES LTDA", domain: "zonadejogo.bet.br", status: "Funcionando" },
  { company: "ZONA DE JOGO NEGÓCIOS E PARTICIPAÇÕES LTDA", domain: "apostaonline.bet.br", status: "Funcionando" },
  { company: "ZONA DE JOGO NEGÓCIOS E PARTICIPAÇÕES LTDA", domain: "onlybets.bet.br", status: "Funcionando" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Create admin user
  const adminPassword = await hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@betscomparator.com" },
    update: {},
    create: {
      id: `admin_${Date.now()}`,
      email: "admin@betscomparator.com",
      name: "Admin Bets Comparator",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // Create all betting houses
  let createdCount = 0;
  for (const house of bettingHouses) {
    try {
      const bet = await prisma.bet.create({
        data: {
          name: house.name || house.domain?.replace(".bet.br", "") || "Sem nome",
          company: house.company,
          domain: house.domain,
          status: house.status,
          scope: house.scope,
          platformType: house.platformType,
        },
      });
      createdCount++;
      
      if (createdCount % 10 === 0) {
        console.log(`📊 Created ${createdCount}/${bettingHouses.length} betting houses...`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${house.domain}:`, error);
    }
  }

  console.log(`✅ Created ${createdCount} betting houses`);
  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

