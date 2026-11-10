import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
