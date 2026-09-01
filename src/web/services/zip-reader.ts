import JSZip from 'jszip';

export const ZIP_LIMITS = {
  MAX_TOTAL_UNCOMPRESSED_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_FILE_COUNT: 1000,
  MAX_SINGLE_FILE_BYTES: 10 * 1024 * 1024, // 10 MB
};

export async function readZipFile(
  file: File,
  onProgress?: (msg: string, percent: number) => void
): Promise<{ name: string; files: Map<string, string> }> {
  onProgress?.('Descompactando arquivo ZIP no navegador...', 20);
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);
  const files = new Map<string, string>();

  const entries = Object.keys(zipData.files).filter(path => {
    const isDir = zipData.files[path].dir;
    if (isDir) return false;
    if (path.includes('__MACOSX') || path.includes('.git/') || path.includes('node_modules/')) return false;
    // Prevent path traversal sequences inside zip filenames
    if (path.includes('../') || path.includes('..\\')) return false;
    return true;
  });

  // SEC-P2-03: File count defensive bound
  if (entries.length > ZIP_LIMITS.MAX_FILE_COUNT) {
    throw new Error(`Limite de segurança excedido: O arquivo ZIP contém ${entries.length} arquivos (máximo permitido: ${ZIP_LIMITS.MAX_FILE_COUNT}).`);
  }

  let totalDecompressedBytes = 0;
  let count = 0;

  for (const path of entries) {
    const zipEntry = zipData.files[path];
    if (zipEntry.dir) continue;

    const text = await zipEntry.async('string');
    const byteSize = text.length; // Approximate UTF-16 / ASCII byte length

    // SEC-P2-03: Single file size check
    if (byteSize > ZIP_LIMITS.MAX_SINGLE_FILE_BYTES) {
      throw new Error(`Arquivo individual muito grande em ${path} (${Math.round(byteSize / 1024 / 1024)}MB). Limite: 10MB.`);
    }

    totalDecompressedBytes += byteSize;

    // SEC-P2-03: Cumulative decompression check against Zip Bomb
    if (totalDecompressedBytes > ZIP_LIMITS.MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error(`Limite de descompressão acumulado excedido (>50MB). O arquivo ZIP foi bloqueado para proteger a integridade do navegador.`);
    }

    files.set(path, text);
    count++;
    onProgress?.(`Lendo ${count}/${entries.length}: ${path}`, 20 + Math.round((count / entries.length) * 70));
  }

  onProgress?.('Concluído!', 100);
  return {
    name: file.name.replace(/\.zip$/i, ''),
    files,
  };
}

export async function readFolderFiles(
  fileList: FileList,
  onProgress?: (msg: string, percent: number) => void
): Promise<{ name: string; files: Map<string, string> }> {
  const files = new Map<string, string>();
  let folderName = 'projeto-local';
  const total = fileList.length;

  if (total > ZIP_LIMITS.MAX_FILE_COUNT) {
    throw new Error(`A pasta selecionada contém ${total} arquivos (limite: ${ZIP_LIMITS.MAX_FILE_COUNT}).`);
  }

  let totalBytes = 0;

  for (let i = 0; i < total; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    if (path.includes('node_modules/') || path.includes('.git/') || path.includes('dist/')) continue;
    
    if (i === 0 && file.webkitRelativePath) {
      folderName = file.webkitRelativePath.split('/')[0] || folderName;
    }

    try {
      if (file.size > ZIP_LIMITS.MAX_SINGLE_FILE_BYTES) {
        console.warn(`Pulando arquivo muito grande: ${path}`);
        continue;
      }
      totalBytes += file.size;
      if (totalBytes > ZIP_LIMITS.MAX_TOTAL_UNCOMPRESSED_BYTES) {
        throw new Error(`Tamanho acumulado da pasta excedeu o limite de segurança de 50MB.`);
      }
      const text = await file.text();
      files.set(path, text);
    } catch (e: any) {
      console.warn('Falha ao ler arquivo local:', path, e.message);
    }

    onProgress?.(`Lendo ${i + 1}/${total}: ${path}`, Math.round(((i + 1) / total) * 90));
  }

  return { name: folderName, files };
}
