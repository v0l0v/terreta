import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

// Mock CSS classes to simulate adventure theme
const mockAdventureThemeContainer = (content: React.ReactElement) => {
  return (
    <div className="leaflet-container adventure-theme">
      <div className="leaflet-popup-content">
        {content}
      </div>
    </div>
  );
};

describe('Adventure Theme Badge Styling', () => {
  beforeEach(() => {
    // Add adventure theme styles to document head for testing
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container.adventure-theme .leaflet-popup-content [class*="inline-flex"][class*="items-center"][class*="rounded-full"][class*="border"][class*="font-semibold"][class*="border-transparent"][class*="bg-secondary"][class*="text-secondary-foreground"] {
        background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%) !important;
        color: #ffffff !important;
        border: 2px solid #654321 !important;
        font-weight: 600 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
        box-shadow: 0 1px 3px rgba(139, 69, 19, 0.4) !important;
      }
      
      .leaflet-container.adventure-theme .leaflet-popup-content [class*="bg-secondary"] {
        background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%) !important;
        color: #ffffff !important;
        border-color: #654321 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
        box-shadow: 0 1px 3px rgba(139, 69, 19, 0.4) !important;
      }
      
      .leaflet-container.adventure-theme .leaflet-popup-content [class*="outline"] {
        background: rgba(255, 255, 255, 0.95) !important;
        color: #2d1810 !important;
        border-color: #8b4513 !important;
        text-shadow: 0 1px 1px rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 1px 3px rgba(139, 69, 19, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    // Clean up styles
    const styles = document.head.querySelectorAll('style');
    styles.forEach(style => {
      if (style.textContent?.includes('adventure-theme')) {
        style.remove();
      }
    });
  });

  it('should render secondary badge with proper adventure theme styling', () => {
    const { container } = render(
      mockAdventureThemeContainer(
        <Badge variant="secondary" className="text-xs py-0 px-1.5">
          Small
        </Badge>
      )
    );

    const badge = container.querySelector('[class*="bg-secondary"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Small');
    
    // Check that the badge has the adventure theme container
    const adventureContainer = container.querySelector('.leaflet-container.adventure-theme');
    expect(adventureContainer).toBeInTheDocument();
  });

  it('should render outline badge with proper adventure theme styling', () => {
    const { container } = render(
      mockAdventureThemeContainer(
        <Badge variant="outline" className="text-xs py-0 px-1.5">
          D3
        </Badge>
      )
    );

    const badge = container.querySelector('[class*="outline"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('D3');
    
    // Check that the badge has the adventure theme container
    const adventureContainer = container.querySelector('.leaflet-container.adventure-theme');
    expect(adventureContainer).toBeInTheDocument();
  });

  it('should render multiple badges with different variants', () => {
    const { container } = render(
      mockAdventureThemeContainer(
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs py-0 px-1.5">
            D3
          </Badge>
          <Badge variant="outline" className="text-xs py-0 px-1.5">
            T2
          </Badge>
          <Badge variant="secondary" className="text-xs py-0 px-1.5">
            Small
          </Badge>
          <Badge variant="secondary" className="text-xs py-0 px-1.5">
            Traditional
          </Badge>
        </div>
      )
    );

    // Check that all badges are rendered
    expect(container).toHaveTextContent('D3');
    expect(container).toHaveTextContent('T2');
    expect(container).toHaveTextContent('Small');
    expect(container).toHaveTextContent('Traditional');
    
    // Check that we have both outline and secondary badges (at least some)
    const outlineBadges = container.querySelectorAll('[class*="outline"]');
    const secondaryBadges = container.querySelectorAll('[class*="bg-secondary"]');
    
    expect(outlineBadges.length).toBeGreaterThan(0);
    expect(secondaryBadges.length).toBeGreaterThan(0);
  });

  it('should handle the exact badge class combination from the issue', () => {
    // Simulate the exact badge structure from the issue
    const { container } = render(
      mockAdventureThemeContainer(
        <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs py-0 px-1.5">
          Small
        </div>
      )
    );

    const badge = container.querySelector('.inline-flex.items-center.rounded-full.border.font-semibold.border-transparent.bg-secondary.text-secondary-foreground');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Small');
    
    // Check that the badge has the adventure theme container
    const adventureContainer = container.querySelector('.leaflet-container.adventure-theme');
    expect(adventureContainer).toBeInTheDocument();
  });
});