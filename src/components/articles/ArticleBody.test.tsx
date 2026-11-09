import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleBody } from './ArticleBody';

describe('ArticleBody', () => {
  it('renders editorial hierarchy, emphasis, lists and callouts as semantic elements', () => {
    const { container } = render(<ArticleBody content={'An opening paragraph.\n\n## Check the water\n\nKeep **clean water** available.\n\n- Check the tank\n- Check the drinkers\n\n> **Act promptly.** Contact your vet.'} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Check the water' })).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('clean water');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.querySelector('blockquote')).toHaveTextContent('Act promptly. Contact your vet.');
  });

  it('prevents stored content from injecting HTML or executable URL schemes', () => {
    const { container } = render(<ArticleBody content={'<script>alert("unsafe")</script>\n\n<img src=x onerror="alert(1)">\n\n[Unsafe](javascript:alert%281%29)\n\n[Find a vet](/find-a-vet)'} />);
    expect(container.querySelector('script, img, [onerror]')).toBeNull();
    expect(screen.getByText('Unsafe').getAttribute('href')).toBeFalsy();
    expect(screen.getByRole('link', { name: 'Find a vet' })).toHaveAttribute('href', '/find-a-vet');
  });

  it('keeps plain paragraphs readable and reserves h1 for the page title', () => {
    const { container } = render(<ArticleBody content={'First paragraph.\n\nSecond paragraph.\n\n# Imported heading'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Imported heading' })).toBeInTheDocument();
  });
});
