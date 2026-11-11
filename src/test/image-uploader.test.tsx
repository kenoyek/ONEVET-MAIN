import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageUploader } from '@/components/media/ImageUploader';
import * as images from '@/lib/services/image-upload-service';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const file = () => new File(['image'], 'photo.png', { type: 'image/png' });

describe('image uploads', () => {
  it('rejects unsupported and oversized files without uploading', async () => {
    const upload = vi.spyOn(images, 'uploadPlatformImage');
    render(<ImageUploader label="Cover image" purpose="articles" images={[]} onChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Upload cover image'), { target: { files: [new File(['svg'], 'bad.svg', { type: 'image/svg+xml' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('JPG, PNG or WebP');
    const big = file(); Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    expect(() => images.validateImageFile(big)).toThrow('10 MB');
    expect(upload).not.toHaveBeenCalled();
  });

  it('attaches uploaded images once and reports busy state until complete', async () => {
    let finish!: (value: string) => void;
    const upload = vi.spyOn(images, 'uploadPlatformImage').mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const change = vi.fn(), busy = vi.fn();
    render(<ImageUploader label="Cover image" purpose="articles" images={[]} onChange={change} onBusyChange={busy} />);
    const input = screen.getByLabelText('Upload cover image');
    fireEvent.change(input, { target: { files: [file()] } });
    fireEvent.change(input, { target: { files: [file()] } });
    expect(upload).toHaveBeenCalledTimes(1); expect(busy).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
    finish('https://example.invalid/upload.webp');
    await waitFor(() => expect(change).toHaveBeenCalledWith(['https://example.invalid/upload.webp']));
    expect(busy).toHaveBeenLastCalledWith(false);
  });

  it('preserves the existing gallery and completed uploads on a partial failure', async () => {
    vi.spyOn(images, 'uploadPlatformImage').mockResolvedValueOnce('https://example.invalid/new.webp').mockRejectedValueOnce(new Error('Connection interrupted'));
    const change = vi.fn();
    render(<ImageUploader label="Product images" purpose="shop" maxImages={5} images={['https://example.invalid/old.webp']} onChange={change} />);
    fireEvent.change(screen.getByLabelText('Upload product images'), { target: { files: [file(), file()] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted');
    expect(change).toHaveBeenCalledWith(['https://example.invalid/old.webp', 'https://example.invalid/new.webp']);
  });

  it('limits gallery size and removes only a selected reference', () => {
    const upload = vi.spyOn(images, 'uploadPlatformImage'), change = vi.fn();
    render(<ImageUploader label="Product images" purpose="shop" maxImages={2} images={['https://example.invalid/old.webp']} onChange={change} />);
    fireEvent.change(screen.getByLabelText('Upload product images'), { target: { files: [file(), file()] } });
    expect(screen.getByRole('alert')).toHaveTextContent('up to 2 images'); expect(upload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove product images 1' }));
    expect(change).toHaveBeenCalledWith([]);
  });
});
