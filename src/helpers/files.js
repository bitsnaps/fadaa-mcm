import apiClient from '@/services/ApiClient';

export const downloadFile = async (folder, docUrl) => {
  if (!docUrl) {
    console.error('No document URL to download.');
    return;
  }
  try {
    const response = await apiClient.get(`/${folder}/download${docUrl.startsWith('/') ? docUrl : '/' + docUrl}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Extract filename from content-disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'downloaded-file';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Error downloading document:', error);
    // showErrorToast('Failed to download document.');
  }  
}

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};