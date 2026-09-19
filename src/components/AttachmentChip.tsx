import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Image as ImageIcon } from 'lucide-react';
import { VisitAttachment } from '../types';

export interface AttachmentChipProps {
  attachment: VisitAttachment;
  onClick?: (attachment: VisitAttachment) => void;
}

export const AttachmentChip: React.FC<AttachmentChipProps> = ({
  attachment,
  onClick,
}) => {
  const navigate = useNavigate();
  const isImage =
    attachment.type === 'image' ||
    attachment.name.toLowerCase().endsWith('.jpg') ||
    attachment.name.toLowerCase().endsWith('.jpeg') ||
    attachment.name.toLowerCase().endsWith('.png');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(attachment);
    } else {
      navigate(`/attachments/${attachment.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Open attachment: ${attachment.name}`}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-surface-alt text-text border border-border rounded-sm text-sm font-sans hover:bg-border/30 active:bg-border/50 transition-colors duration-120 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      {isImage ? (
        <ImageIcon className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
      ) : (
        <Paperclip className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
      )}
      <span className="truncate max-w-[200px] text-text">{attachment.name}</span>
    </button>
  );
};
