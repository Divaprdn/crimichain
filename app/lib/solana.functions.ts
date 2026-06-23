import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const PUBLIC_RPCS = [
  "https://api.devnet.solana.com",
  "https://solana-devnet.gateway.tatum.io",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRpcList(): string[] {
  const envRpc = import.meta.env.VITE_SOLANA_RPC_URL as string | undefined;
  if (envRpc) return [envRpc, ...PUBLIC_RPCS];
  return PUBLIC_RPCS;
}

function getPayerKeypair(): Keypair {
  const secret = import.meta.env.VITE_SOLANA_PAYER_SECRET_KEY as string | undefined;
  if (secret) {
    try {
      const arr = JSON.parse(secret);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch (e) {
      console.warn("[CrimiChain] Failed to parse SOLANA_PAYER_SECRET_KEY:", e);
    }
  }
  // Fallback ephemeral
  return Keypair.generate();
}

export interface AnchorResult {
  signature: string;
  explorerUrl: string;
  rpc: string;
  payer: string;
  demo: boolean;
}

// ─── anchorHashOnDevnet ───────────────────────────────────────────────────────
export async function anchorHashOnDevnet(input: {
  data: { hash: string; action: string; reportId: string };
}): Promise<AnchorResult> {
  const { data } = input;
  const rpcs = getRpcList();
  const keypair = getPayerKeypair();

  // Try each RPC
  let connection: Connection | null = null;
  let usedRpc = "";
  for (const rpc of rpcs) {
    try {
      const conn = new Connection(rpc, "confirmed");
      await conn.getSlot();
      connection = conn;
      usedRpc = rpc;
      break;
    } catch {
      // try next
    }
  }

  if (!connection) {
    throw new Error("Semua RPC Solana tidak tersedia. Coba lagi nanti.");
  }

  // Build memo transaction
  const memo = JSON.stringify({
    app: "CrimiChain",
    v: "1",
    action: data.action,
    report: data.reportId,
    hash: data.hash,
    ts: new Date().toISOString(),
  });

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf-8"),
  });

  const tx = new Transaction().add(instruction);

  const signature = await sendAndConfirmTransaction(connection, tx, [keypair], {
    commitment: "confirmed",
  });

  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return {
    signature,
    explorerUrl,
    rpc: usedRpc,
    payer: keypair.publicKey.toBase58(),
    demo: false,
  };
}

// ─── getBlockchainDiagnostics ─────────────────────────────────────────────────
export async function getBlockchainDiagnostics() {
  const rpcs = getRpcList();
  const keypair = getPayerKeypair();

  const rpcStatuses = await Promise.all(
    rpcs.map(async (url) => {
      const t0 = Date.now();
      try {
        const conn = new Connection(url, "confirmed");
        await conn.getSlot();
        return { url, ok: true, latencyMs: Date.now() - t0 };
      } catch (err: any) {
        return { url, ok: false, latencyMs: Date.now() - t0, error: err.message };
      }
    })
  );

  let balanceSol = 0;
  const workingRpc = rpcStatuses.find((r) => r.ok);
  if (workingRpc) {
    try {
      const conn = new Connection(workingRpc.url, "confirmed");
      const lamports = await conn.getBalance(keypair.publicKey);
      balanceSol = lamports / LAMPORTS_PER_SOL;
    } catch {}
  }

  const envRpc = import.meta.env.VITE_SOLANA_RPC_URL as string | undefined;
  const envSecret = import.meta.env.VITE_SOLANA_PAYER_SECRET_KEY as string | undefined;

  return {
    rpcs: rpcStatuses,
    payer: {
      pubkey: keypair.publicKey.toBase58(),
      balanceSol,
      ephemeral: !envSecret,
    },
    env: {
      SOLANA_RPC_URL: envRpc ? `${envRpc.slice(0, 30)}…` : "(tidak diisi)",
      SOLANA_PAYER_SECRET_KEY: envSecret ? `[set, ${envSecret.length} chars]` : "(tidak diisi — ephemeral)",
      SUPABASE_URL: "(demo mode)",
      SUPABASE_PUBLISHABLE_KEY: "(demo mode)",
    },
    recentEvents: [],
    demo: false,
  };
}
