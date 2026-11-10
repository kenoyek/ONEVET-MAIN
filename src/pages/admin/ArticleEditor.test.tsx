import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArticleEditor from './ArticleEditor';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ profile: { id: 'editor-profile' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav aria-label="Site" /> }));

beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
const switchToPreview = () => fireEvent.mouseDown(screen.getByRole('tab', { name: 'Preview' }), { button: 0, ctrlKey: false });

describe('ArticleEditor preview', () => {
  it('previews unsaved Markdown and preserves draft fields and visibility without submitting', () => {
    const { container } = render(<MemoryRouter><ArticleEditor /></MemoryRouter>);
    const submit = vi.fn();
    container.querySelector('form')!.addEventListener('submit', submit);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A healthier flock' } });
    fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: 'A daily care routine.' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '## Check the water\n\nProvide **fresh water**.\n\n> Call your vet if concerned.' } });
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'poultry, care' } });
    fireEvent.change(screen.getByLabelText('Cover image URL'), { target: { value: 'https://1vet.store/images/articles/poultry-morning-flock.webp' } });
    fireEvent.click(screen.getByRole('switch', { name: 'Published' }));
    switchToPreview();
    expect(screen.getByRole('heading', { level: 2, name: 'A healthier flock' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Check the water' })).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('fresh water');
    expect(container.querySelector('blockquote')).toHaveTextContent('Call your vet if concerned.');
    expect(screen.getByText('A daily care routine.')).toBeInTheDocument();
    expect(screen.getByText('poultry')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/articles/poultry-morning-flock.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(screen.getByLabelText('Title')).toHaveValue('A healthier flock');
    expect(screen.getByLabelText('Slug')).toHaveValue('a-healthier-flock');
    expect((screen.getByLabelText('Content') as HTMLTextAreaElement).value).toContain('## Check the water');
    expect(screen.getByRole('switch', { name: 'Published' })).toBeChecked();
    expect(submit).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('formats a selection and previews the result without submitting the article', () => {
    const { container } = render(<MemoryRouter><ArticleEditor /></MemoryRouter>);
    const submit = vi.fn();
    container.querySelector('form')!.addEventListener('submit', submit);
    const input = screen.getByLabelText('Content') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Provide clean water every day.' } });
    input.setSelectionRange(8, 19);
    fireEvent.click(screen.getByRole('button', { name: /^Bold$/ }));
    expect(input.value).toBe('Provide **clean water** every day.');
    switchToPreview();
    expect(container.querySelector('strong')).toHaveTextContent('clean water');
    expect(submit).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('offers a useful empty preview without treating placeholders as saved content', () => {
    render(<MemoryRouter><ArticleEditor /></MemoryRouter>);
    switchToPreview();
    expect(screen.getByRole('heading', { name: 'Your article title' })).toBeInTheDocument();
    expect(screen.getByText('Your article will appear here as you write.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Content')).toHaveValue('');
    expect(from).not.toHaveBeenCalled();
  });
});


describe('ArticleEditor publishing', () => {
  const article = { id: 'article-one', title: 'Flock care', slug: 'flock-care', content: 'Check clean water.', category: 'Livestock', excerpt: '', tags: [], image_url: null, is_published: false, published_at: null as string | null };
  function renderExisting(data = article, result: Promise<unknown> = Promise.resolve({ data: { id: article.id }, error: null })) {
    const single = vi.fn(() => result);
    const mutation = { eq: vi.fn(), select: vi.fn(), single };
    mutation.eq.mockReturnValue(mutation);
    mutation.select.mockReturnValue(mutation);
    const update = vi.fn((_data: unknown) => mutation);
    const fetch = { select: vi.fn(), eq: vi.fn(), single: vi.fn(async () => ({ data, error: null })) };
    fetch.select.mockReturnValue(fetch);
    fetch.eq.mockReturnValue(fetch);
    from.mockReturnValueOnce(fetch).mockReturnValue({ update });
    const view = render(<MemoryRouter initialEntries={['/admin/articles/article-one/edit']}><Routes>
      <Route path="/admin/articles/:id/edit" element={<ArticleEditor />} />
      <Route path="/admin/articles" element={<p>Returned to article library</p>} />
    </Routes></MemoryRouter>);
    return { ...view, update };
  }

  it('publishes a saved draft once, assigns its first date and locks edits while saving', async () => {
    let finish!: (result: unknown) => void;
    const result = new Promise(resolve => { finish = resolve; });
    const { container, update } = renderExisting(article, result);
    await screen.findByLabelText('Title');
    fireEvent.click(screen.getByRole('switch', { name: 'Published' }));
    expect(screen.getByRole('button', { name: 'Publish article' })).toBeInTheDocument();
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ is_published: true, published_at: expect.any(String) }));
    expect(screen.getByLabelText('Title')).toBeDisabled();
    finish({ data: { id: article.id }, error: null });
    await screen.findByText('Returned to article library');
  });

  it('retains an original publication date on unpublish', async () => {
    const date = '2026-11-09T10:00:00.000Z';
    const { container, update } = renderExisting({ ...article, is_published: true, published_at: date });
    await screen.findByLabelText('Title');
    fireEvent.click(screen.getByRole('switch', { name: 'Published' }));
    expect(screen.getByRole('button', { name: 'Unpublish article' })).toBeInTheDocument();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ is_published: false, published_at: date })));
    await screen.findByText('Returned to article library');
  });

  it('keeps edited content available for retry after a failed save', async () => {
    const { container, update } = renderExisting(article, Promise.resolve({ data: null, error: { code: '42501' } }));
    await screen.findByLabelText('Title');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved revision' } });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Title')).not.toBeDisabled());
    expect(screen.getByLabelText('Title')).toHaveValue('Unsaved revision');
    expect(screen.queryByText('Returned to article library')).not.toBeInTheDocument();
  });
});
