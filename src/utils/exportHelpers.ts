import { ChatMessage } from '../types';

// Export chat as Markdown
export const exportChatAsMarkdown = (messages: ChatMessage[], documentName?: string): void => {
  let markdown = '# Chat Export\n\n';

  if (documentName) {
    markdown += `**Document:** ${documentName}\n\n`;
  }

  markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  markdown += '---\n\n';

  messages.forEach((message) => {
    const timestamp = message.timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (message.isUser) {
      markdown += `### You (${timestamp})\n\n`;
      markdown += `${message.text}\n\n`;
    } else {
      markdown += `### ${message.aiModel || 'AI'} (${timestamp})\n\n`;
      markdown += `${message.text}\n\n`;

      // Include chart information
      if (message.chartData && message.chartData.length > 0) {
        markdown += `**Charts included:** ${message.chartData.length} visualization(s)\n`;
        message.chartData.forEach((chart, index) => {
          markdown += `- ${chart.title || `Chart ${index + 1}`} (${chart.type})\n`;
        });
        markdown += '\n';
      }
    }

    markdown += '---\n\n';
  });

  // Create download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-export-${Date.now()}.md`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export chat as JSON
export const exportChatAsJSON = (messages: ChatMessage[], documentName?: string): void => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    documentName: documentName || null,
    messageCount: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      isUser: msg.isUser,
      timestamp: msg.timestamp.toISOString(),
      aiModel: msg.aiModel || null,
      chartCount: msg.chartData?.length || 0,
      charts: msg.chartData?.map(chart => ({
        type: chart.type,
        title: chart.title || null,
        dataPoints: chart.data.length,
      })) || []
    }))
  };

  const json = JSON.stringify(exportData, null, 2);

  // Create download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-export-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export chat as plain text
export const exportChatAsText = (messages: ChatMessage[], documentName?: string): void => {
  let text = 'CHAT EXPORT\n';
  text += '='.repeat(50) + '\n\n';

  if (documentName) {
    text += `Document: ${documentName}\n`;
  }

  text += `Exported: ${new Date().toLocaleString()}\n`;
  text += `Total Messages: ${messages.length}\n`;
  text += '='.repeat(50) + '\n\n';

  messages.forEach((message, index) => {
    const timestamp = message.timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (message.isUser) {
      text += `[${timestamp}] You:\n`;
      text += `${message.text}\n\n`;
    } else {
      text += `[${timestamp}] ${message.aiModel || 'AI'}:\n`;
      text += `${message.text}\n`;

      if (message.chartData && message.chartData.length > 0) {
        text += `\n[Charts: ${message.chartData.length} visualization(s) included]\n`;
      }
      text += '\n';
    }

    text += '-'.repeat(50) + '\n\n';
  });

  // Create download
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-export-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
