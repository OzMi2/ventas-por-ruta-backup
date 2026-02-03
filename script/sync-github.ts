import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_OWNER = 'OzMi2';
const REPO_NAME = 'ventas-por-ruta';

const FILES_TO_SYNC = [
  'client/index.html',
  'client/src/App.tsx',
  'client/src/components/AppShell.tsx',
  'client/src/components/DataTable.tsx',
  'client/src/components/ProtectedRoute.tsx',
  'client/src/components/SearchInput.tsx',
  'client/src/components/TicketPrint.tsx',
  'client/src/components/ToastHost.tsx',
  'client/src/components/ui/accordion.tsx',
  'client/src/components/ui/alert-dialog.tsx',
  'client/src/components/ui/alert.tsx',
  'client/src/components/ui/aspect-ratio.tsx',
  'client/src/components/ui/avatar.tsx',
  'client/src/components/ui/badge.tsx',
  'client/src/components/ui/breadcrumb.tsx',
  'client/src/components/ui/button-group.tsx',
  'client/src/components/ui/button.tsx',
  'client/src/components/ui/calendar.tsx',
  'client/src/components/ui/card.tsx',
  'client/src/components/ui/carousel.tsx',
  'client/src/components/ui/chart.tsx',
  'client/src/components/ui/checkbox.tsx',
  'client/src/components/ui/collapsible.tsx',
  'client/src/components/ui/command.tsx',
  'client/src/components/ui/context-menu.tsx',
  'client/src/components/ui/dialog.tsx',
  'client/src/components/ui/drawer.tsx',
  'client/src/components/ui/dropdown-menu.tsx',
  'client/src/components/ui/empty.tsx',
  'client/src/components/ui/field.tsx',
  'client/src/components/ui/form.tsx',
  'client/src/components/ui/hover-card.tsx',
  'client/src/components/ui/input-group.tsx',
  'client/src/components/ui/input-otp.tsx',
  'client/src/components/ui/input.tsx',
  'client/src/components/ui/item.tsx',
  'client/src/components/ui/kbd.tsx',
  'client/src/components/ui/label.tsx',
  'client/src/components/ui/menubar.tsx',
  'client/src/components/ui/navigation-menu.tsx',
  'client/src/components/ui/pagination.tsx',
  'client/src/components/ui/popover.tsx',
  'client/src/components/ui/progress.tsx',
  'client/src/components/ui/radio-group.tsx',
  'client/src/components/ui/resizable.tsx',
  'client/src/components/ui/scroll-area.tsx',
  'client/src/components/ui/select.tsx',
  'client/src/components/ui/separator.tsx',
  'client/src/components/ui/sheet.tsx',
  'client/src/components/ui/sidebar.tsx',
  'client/src/components/ui/skeleton.tsx',
  'client/src/components/ui/slider.tsx',
  'client/src/components/ui/sonner.tsx',
  'client/src/components/ui/spinner.tsx',
  'client/src/components/ui/switch.tsx',
  'client/src/components/ui/table.tsx',
  'client/src/components/ui/tabs.tsx',
  'client/src/components/ui/textarea.tsx',
  'client/src/components/ui/toaster.tsx',
  'client/src/components/ui/toast.tsx',
  'client/src/components/ui/toggle-group.tsx',
  'client/src/components/ui/toggle.tsx',
  'client/src/components/ui/tooltip.tsx',
  'client/src/hooks/use-mobile.tsx',
  'client/src/hooks/use-toast.ts',
  'client/src/index.css',
  'client/src/lib/api.ts',
  'client/src/lib/queryClient.ts',
  'client/src/lib/utils.ts',
  'client/src/main.tsx',
  'client/src/pages/Abonos.tsx',
  'client/src/pages/admin/Clientes.tsx',
  'client/src/pages/admin/DescuentosClientes.tsx',
  'client/src/pages/admin/Descuentos.tsx',
  'client/src/pages/admin/DescuentosVolumen.tsx',
  'client/src/pages/admin/Productos.tsx',
  'client/src/pages/auditoria/EntradaBodega.tsx',
  'client/src/pages/auditoria/MoverStock.tsx',
  'client/src/pages/auditoria/Movimientos.tsx',
  'client/src/pages/auditoria/StockBodega.tsx',
  'client/src/pages/Checkout.tsx',
  'client/src/pages/Clientes.tsx',
  'client/src/pages/Configuracion.tsx',
  'client/src/pages/Historial.tsx',
  'client/src/pages/Login.tsx',
  'client/src/pages/MiHistorial.tsx',
  'client/src/pages/not-found.tsx',
  'client/src/pages/Productos.tsx',
  'client/src/services/admin.ts',
  'client/src/services/api.ts',
  'client/src/services/auditoria.ts',
  'client/src/services/auth.ts',
  'client/src/services/clientes.ts',
  'client/src/services/discounts.ts',
  'client/src/services/historial.ts',
  'client/src/services/productos.ts',
  'client/src/services/ventas.ts',
  'client/src/store/storage.ts',
  'client/src/store/store.tsx',
  'client/src/store/types.ts',
  'client/src/vite-env.d.ts',
  'components.json',
  'drizzle.config.ts',
  '.gitignore',
  'package.json',
  'postcss.config.js',
  'Procfile',
  'railway.json',
  'render.yaml',
  'replit.md',
  'script/build.ts',
  'server/github.ts',
  'server/index.ts',
  'server/routes.ts',
  'server/seed.ts',
  'server/static.ts',
  'server/storage.ts',
  'server/vite.ts',
  'shared/schema.ts',
  'tsconfig.json',
  'vite.config.ts',
  'vite-plugin-meta-images.ts',
  'docs/DOCUMENTACION_COMPLETA.md',
];

async function getFileSha(octokit: any, filePath: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
    });
    return (data as any).sha;
  } catch (e: any) {
    if (e.status === 404) return null;
    throw e;
  }
}

async function uploadFile(octokit: any, filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const base64Content = Buffer.from(content).toString('base64');
  
  const sha = await getFileSha(octokit, filePath);
  
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: filePath,
    message: `Sync ${filePath}`,
    content: base64Content,
    sha: sha || undefined,
  });
  
  return true;
}

async function main() {
  console.log('Syncing ALL files to GitHub...\n');
  console.log(`Total files: ${FILES_TO_SYNC.length}\n`);
  
  const octokit = await getUncachableGitHubClient();
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < FILES_TO_SYNC.length; i++) {
    const file = FILES_TO_SYNC[i];
    process.stdout.write(`[${i + 1}/${FILES_TO_SYNC.length}] ${file}... `);
    
    if (!fs.existsSync(file)) {
      console.log('NOT FOUND');
      failed++;
      continue;
    }
    
    try {
      await uploadFile(octokit, file);
      console.log('OK');
      success++;
    } catch (e: any) {
      console.log(`ERROR: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Sync complete!`);
  console.log(`Success: ${success}, Failed: ${failed}`);
  console.log(`Repository: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
}

main().catch(console.error);
