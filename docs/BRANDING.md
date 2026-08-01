# OpenCurrency Brand Guidelines

**Version:** 1.1  
**Status:** Updated master with logo system  
**Product:** Open-source currency converter  
**Primary descriptor:** Simple Currency Converter

![OpenCurrency branding concept](OpenCurrency_Branding_Concept.png)

![OpenCurrency logo system](OpenCurrency_Logo_System.png)

---

## 1. Brand Overview

### Brand name

**OpenCurrency**

The name combines two direct ideas:

- **Open** communicates open source, transparency, accessible data, and a product that does not hide its operation behind financial jargon.
- **Currency** states the app's exact domain without implying money transfer, trading, banking, or physical exchange services.

The name is intentionally plain. The product should be understood before it is admired.

### Product definition

OpenCurrency is a small, open-source utility that converts monetary values using openly available daily reference exchange rates.

It is a calculator, not a trading platform, remittance service, bank, wallet, or foreign-exchange marketplace.

### Brand promise

> Clear currency conversion using transparent daily reference rates.

### Primary tagline

> **Simple converter, nothing more.**

### Product subtitle

> **Simple Currency Converter**

Use the subtitle in app stores, repository descriptions, landing pages, and other places where immediate category recognition matters.

---

## 2. Positioning

### Positioning statement

For people who need a quick currency calculation, OpenCurrency is a lightweight open-source currency converter that uses openly available daily reference rates. Unlike finance dashboards, exchange services, and ad-heavy converter apps, it focuses on one task and clearly shows the rate source and update date.

### Core benefits

1. **Simple**  
   A focused interface with no accounts, ads, news, trading tools, or unrelated financial features.

2. **Transparent**  
   The app identifies its data source, rate date, and calculation basis.

3. **Lightweight**  
   Fast startup, a small interface, minimal dependencies, and efficient use of network and device resources.

4. **Open**  
   Public source code, documented behavior, and visible data-provider attribution.

5. **Neutral**  
   The app calculates values without recommending trades, transfers, purchases, or financial decisions.

### Audience

Primary users include:

- Travelers checking approximate values
- Developers and open-source users
- Remote workers and freelancers
- Online shoppers
- Students and researchers
- Anyone needing a quick daily reference conversion

### Product boundaries

OpenCurrency does not:

- Exchange or transfer money
- Quote executable foreign-exchange prices
- Provide real-time market rates unless a future data source explicitly supports them
- Recommend financial actions
- Guarantee the amount a bank, card issuer, broker, or exchange service will charge
- Include spreads, transfer fees, card fees, taxes, or commissions unless clearly added by the user

---

## 3. Brand Principles

### Clarity before personality

Labels should describe exactly what they do. Avoid clever terminology when a common word is available.

### Honest data communication

Use **daily reference rate** rather than **live rate** when the data updates daily. Always show the effective date or last successful update.

### Utility over engagement

The app should help the user finish quickly. Do not add features solely to increase session length.

### Calm, not financial

The interface should feel like a dependable calculator. Avoid the visual language of trading apps, including flashing prices, red-green market signals, candlestick charts, profit indicators, and urgency cues.

### Open by default

Source attribution, licensing, privacy behavior, and calculation rules should be easy to find.

---

## 4. Visual Identity

### Design direction

OpenCurrency uses a restrained blue-and-teal system:

- **Blue** represents reliability, structure, and the primary action.
- **Teal** represents conversion results, freshness, and secondary emphasis.
- **Neutral navy and gray tones** keep the interface calm and readable.

The visual language should be:

- Minimal
- Geometric
- Spacious
- Accessible
- Platform-neutral
- Recognizable at small sizes

Avoid decorative gradients in functional UI. A subtle blue-to-teal gradient may be used in the app icon or promotional artwork, but the core application should rely on solid colors.

---

## 5. Color Palette

### Core colors

| Token | Hex | Role |
|---|---:|---|
| Primary Blue | `#2563EB` | Primary buttons, active controls, links, swap action |
| Accent Teal | `#14B8A6` | Conversion result, freshness indicators, secondary emphasis |
| Dark Text | `#111827` | Primary text in light mode |
| Secondary Text | `#6B7280` | Supporting text, labels, timestamps |
| Light Background | `#F8FAFC` | Main light-mode surface |
| Border / Divider | `#E2E8F0` | Borders, separators, inactive outlines |
| Dark Background | `#0F172A` | Main dark-mode surface |

### Supporting colors

| Token | Hex | Role |
|---|---:|---|
| Light Surface | `#FFFFFF` | Cards and raised surfaces in light mode |
| Dark Surface | `#111C2F` | Cards and raised surfaces in dark mode |
| Dark Border | `#263449` | Borders and separators in dark mode |
| Dark Primary Text | `#F8FAFC` | Primary text in dark mode |
| Dark Secondary Text | `#94A3B8` | Supporting text in dark mode |
| Teal Tint | `#E6FFFB` | Light result background or informational highlight |
| Blue Tint | `#EFF6FF` | Selected or focused light-mode control |
| Error | `#DC2626` | Errors only, never negative market movement |
| Warning | `#D97706` | Stale data or degraded service state |
| Success | `#059669` | Successful refresh or valid cached data state |

### Color usage ratios

A typical screen should approximately use:

- 70% neutral background and surfaces
- 20% text, borders, and structural neutrals
- 7% primary blue
- 3% accent teal

Blue and teal should guide attention, not fill the screen.

### Accessibility

- Maintain a minimum contrast ratio of **4.5:1** for normal text.
- Maintain at least **3:1** for large text and essential UI boundaries.
- Never communicate state by color alone. Pair color with an icon, label, or message.
- Do not use teal text on a light teal surface for small body copy unless contrast has been verified.

---

## 6. Theme Specifications

### Light mode

| Element | Value |
|---|---|
| App background | `#F8FAFC` |
| Card background | `#FFFFFF` |
| Primary text | `#111827` |
| Secondary text | `#6B7280` |
| Border | `#E2E8F0` |
| Primary action | `#2563EB` |
| Result emphasis | `#0F9F93` or accessible teal variant |
| Result surface | `#E6FFFB` |
| Focus ring | `#2563EB` at 30% opacity |

### Dark mode

| Element | Value |
|---|---|
| App background | `#0F172A` |
| Card background | `#111C2F` |
| Primary text | `#F8FAFC` |
| Secondary text | `#94A3B8` |
| Border | `#263449` |
| Primary action | `#3B82F6` |
| Result emphasis | `#2DD4BF` |
| Result surface | `#0B3134` |
| Focus ring | `#60A5FA` at 40% opacity |

### Theme behavior

- Follow the operating system theme by default.
- Allow explicit Light, Dark, and System choices.
- Preserve the user's choice locally.
- Avoid pure black surfaces except for platform-level elements where required.
- Keep the information hierarchy identical across themes.

---

## 7. Typography

### Recommended typefaces

**Primary interface font:** Inter  
**Numeric or monospaced option:** Geist Mono or IBM Plex Mono

Use system fonts when minimizing bundle size is more important than exact brand typography.

Recommended system stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

### Numeric styling

- Use tabular numerals for amounts and rates.
- Keep decimal alignment stable while typing.
- Use a monospaced face only where it improves scanning. Do not make the entire interface monospaced.

```css
font-variant-numeric: tabular-nums;
```

### Type scale

| Style | Size | Weight | Use |
|---|---:|---:|---|
| Display amount | 40–48 px | 500–600 | Main input and conversion result |
| Screen title | 20–24 px | 600 | Page title or wordmark |
| Currency code | 18–20 px | 600 | USD, EUR, TND |
| Body | 16 px | 400 | General interface copy |
| Label | 13–14 px | 500 | Amount, converted amount |
| Caption | 12–13 px | 400 | Rate date, attribution, helper text |

Use sentence case throughout the interface.

---

## 8. Logo and Wordmark

### Wordmark

Write the name as one word with capital **O** and **C**:

> **OpenCurrency**

Preferred visual treatment:

- **Open** in the primary text color
- **Currency** in Primary Blue
- In dark mode, **Open** may switch to white while **Currency** remains blue
- In monochrome contexts, use a single color version of the wordmark

### Symbol concept

The preferred symbol is now based on an **open-source inspired ring**.

Construction summary:

- An outer circular mark inspired by the open-source logo silhouette
- The outer ring is divided into clear sections
- Each section can carry a currency symbol
- The central circle contains circular exchange arrows
- The bottom opening preserves the feeling of openness and matches the open-source inspiration

This symbol communicates three ideas at once:

1. **Open** through the open-source inspired outer form
2. **Currency** through the segmented currency symbols
3. **Conversion** through the circular arrows in the center

### Approved currency set

The default currency symbols in the master mark are:

- **$**
- **€**
- **£**
- **¥**

These should remain simple, centered, and visually balanced inside their sections.

Do not overcrowd the symbol with too many currencies. The logo should suggest global currency conversion, not exhaustively list every currency.

### Geometry and composition

The preferred icon has:

- A segmented outer ring with alternating blue and teal sections
- White separators between sections
- A white inner circle
- Two circular arrows in the center, one blue and one teal
- A distinct bottom opening aligned with the open-source motif

The center arrows should feel like a calm swap or conversion motion, not a loading spinner.

### App icon direction

Preferred construction:

- Rounded-square app icon container
- White or light neutral background
- Full-color segmented ring symbol centered inside
- No added text inside the app icon
- Keep the symbol large enough to stay readable at small sizes
- See example in 'BRANDING.png'

### Color application

Use the brand palette as follows:

- **Primary Blue** for one or more outer sections and one inner arrow
- **Accent Teal** for the remaining outer sections and the second inner arrow
- **White** for separators and currency glyphs
- **Dark Navy / Black** for monochrome variants

A flat color treatment is preferred. Gradients may be used in promotional mockups, but the production logo system should work cleanly in flat color.

### Logo variants

Maintain these approved variants:

1. **Primary full-color logo on light background**  
   Segmented blue and teal ring, white inner circle, colored arrows, and two-tone wordmark.

2. **App icon variant**  
   Symbol only, centered in a rounded-square container.

3. **Monochrome variant**  
   Single-color symbol and wordmark for stamps, print, and constrained environments.

4. **Dark background variant**  
   Full-color symbol with the wordmark adapted for dark surfaces.

### Minimum clear space

Maintain clear space around the logo equal to the width of one outer segment divider, or at minimum the cap height of the letter **O** in the wordmark lockup.

### Minimum sizes

- **App icon:** must remain legible at 16 px, preferred export sizes 32 px and above
- **Symbol only:** minimum display size 20 px
- **Full wordmark lockup:** minimum height 24 px in UI contexts

If the symbol becomes unclear at very small sizes, use a simplified export with fewer visual refinements, not a redesigned mark.

### Accessibility and legibility

- Ensure sufficient contrast in dark and light variants
- Do not rely on thin strokes for the inner arrows
- Keep currency symbols bold enough to remain recognizable
- Preserve the open bottom notch so the open-source inspiration remains visible

### Incorrect usage

Do not:

- Stretch or condense the logo
- Remove the center arrows while keeping the segmented ring
- Replace the currency symbols with random letters
- Fill the center circle with gradients, textures, or shadows that reduce clarity
- Rotate the symbol arbitrarily
- Change the bottom notch into a closed circle
- Place the logo over busy imagery without a protected background
- Add slogans inside the icon


## 9. Interface Design System

### Layout

The main converter should fit within one screen on a typical phone without requiring scrolling.

Recommended order:

1. App header
2. Amount input
3. Source currency selector
4. Swap action
5. Target currency selector
6. Converted result
7. Rate and update date
8. Data-source attribution or details

### Spacing

Use a 4 px base unit.

| Token | Size |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |

### Shape

| Element | Radius |
|---|---:|
| Small badge | 8 px |
| Input or selector | 12–16 px |
| Card | 16 px |
| Circular action | 999 px |

Avoid excessive pill-shaped elements. Use pills mainly for compact currency codes or statuses.

### Shadows

Keep shadows subtle and optional.

```css
box-shadow: 0 1px 2px rgb(15 23 42 / 0.06),
            0 4px 12px rgb(15 23 42 / 0.04);
```

In dark mode, prefer borders and tonal separation over large shadows.

### Currency selectors

Each selector should display:

- ISO 4217 code as the primary identifier
- Currency name as secondary text
- Optional flag as supporting decoration

Flags must not be the only identifier because currencies and territories do not always map one-to-one.

### Swap action

The swap control exchanges the source and target currencies. It should not imply a financial transaction.

Recommended accessible label:

> Swap source and target currencies

### Result presentation

The converted value is the strongest element after the input amount. Teal may be used for emphasis, but the result must remain readable without color.

### Loading and refresh

- Preserve the last valid result while a refresh is in progress.
- Show a small progress indicator near the rate metadata, not over the whole screen.
- Do not animate numeric values excessively.
- Respect reduced-motion preferences.

---

## 10. Product Voice

### Voice characteristics

OpenCurrency sounds:

- Direct
- Calm
- Neutral
- Transparent
- Helpful
- Technically accurate

It does not sound:

- Promotional
- Urgent
- Financially speculative
- Playful at the expense of clarity
- Overly technical in the main interface

### Writing rules

- Use short, literal labels.
- Prefer common words over financial terminology.
- State what happened and what the user can do next.
- Distinguish daily reference rates from live market quotes.
- Avoid promises about accuracy that depend on third-party providers.

### Preferred terminology

| Use | Avoid |
|---|---|
| Currency converter | FX platform |
| Convert | Exchange money |
| Daily reference rate | Live market price |
| Updated on | Streaming now |
| Data source | Liquidity provider |
| Approximate value | Guaranteed amount |
| Source currency | Base asset |
| Target currency | Quote asset |

### Interface examples

**Labels**

- Amount
- From
- To
- Converted amount
- Swap currencies
- Rate details
- Updated today
- Daily reference rate

**Status messages**

- Rates updated successfully.
- Using rates from July 27, 2026.
- New rates are unavailable. Showing the most recently downloaded data.
- No network connection. Cached rates are being used.
- This currency is not available from the current data source.

**Disclaimer**

> Rates are provided for informational purposes and may differ from rates offered by banks, card issuers, or exchange services.

---

## 11. Taglines and Messaging

### Primary tagline

> Currency conversion, without the clutter.

### Supporting lines

- Simple rates. Straight answers.
- Open rates. Clear conversions.
- A lightweight converter for daily reference rates.
- No account. No ads. Just the conversion.
- Clear daily rates from open sources.

### One-sentence description

> OpenCurrency is a lightweight open-source currency converter using openly available daily reference rates.

### Short repository description

> A simple open-source currency converter using daily reference exchange rates.

### Longer product description

> OpenCurrency provides quick, transparent currency calculations through a focused interface. It uses openly available daily reference rates, shows when the data was updated, and avoids accounts, advertising, trading tools, and unnecessary financial features.

---

## 12. App Store and Discovery Copy

### Recommended app title

> **OpenCurrency: Currency Converter**

Use the full title where store rules and character limits allow. Inside the app and in the launcher, use **OpenCurrency**.

### Subtitle

> Simple daily currency conversion

### Short description

> A lightweight open-source currency converter with transparent daily reference rates.

### Suggested search terms

Use store metadata rather than forcing every keyword into the visible brand name.

- currency converter
- currency conversion
- exchange rate calculator
- daily exchange rates
- money converter
- open-source converter
- offline currency converter, only if cached offline conversion is implemented

Do not use **live exchange rates** unless the data is genuinely live.

---

## 13. Open-Source Identity

### Repository naming

Preferred repository slug:

```text
open-currency
```

Alternative:

```text
opencurrency
```

### README opening

> OpenCurrency is a simple open-source currency converter. It retrieves openly available daily reference rates and performs clear, focused conversions without accounts, ads, trading features, or unnecessary financial tools.

### Community principles

- Document the active rate provider.
- Keep provider-specific logic replaceable.
- Publish the data refresh behavior.
- Explain caching and offline behavior.
- List licenses for code, icons, fonts, and external data.
- Avoid analytics by default. If analytics are added, disclose them clearly and offer a privacy-respecting configuration.

---

## 14. Design Tokens

### CSS custom properties

```css
:root {
  color-scheme: light;

  --oc-primary: #2563eb;
  --oc-primary-hover: #1d4ed8;
  --oc-accent: #14b8a6;
  --oc-accent-strong: #0f9f93;

  --oc-background: #f8fafc;
  --oc-surface: #ffffff;
  --oc-text-primary: #111827;
  --oc-text-secondary: #6b7280;
  --oc-border: #e2e8f0;

  --oc-info-surface: #eff6ff;
  --oc-result-surface: #e6fffb;
  --oc-error: #dc2626;
  --oc-warning: #d97706;
  --oc-success: #059669;

  --oc-radius-sm: 8px;
  --oc-radius-md: 12px;
  --oc-radius-lg: 16px;
  --oc-focus-ring: 0 0 0 3px rgb(37 99 235 / 0.3);
}

[data-theme="dark"] {
  color-scheme: dark;

  --oc-primary: #3b82f6;
  --oc-primary-hover: #60a5fa;
  --oc-accent: #2dd4bf;
  --oc-accent-strong: #5eead4;

  --oc-background: #0f172a;
  --oc-surface: #111c2f;
  --oc-text-primary: #f8fafc;
  --oc-text-secondary: #94a3b8;
  --oc-border: #263449;

  --oc-info-surface: #172554;
  --oc-result-surface: #0b3134;
  --oc-error: #f87171;
  --oc-warning: #fbbf24;
  --oc-success: #34d399;

  --oc-focus-ring: 0 0 0 3px rgb(96 165 250 / 0.4);
}
```

### JSON token example

```json
{
  "brand": {
    "name": "OpenCurrency",
    "primary": "#2563EB",
    "accent": "#14B8A6"
  },
  "light": {
    "background": "#F8FAFC",
    "surface": "#FFFFFF",
    "textPrimary": "#111827",
    "textSecondary": "#6B7280",
    "border": "#E2E8F0"
  },
  "dark": {
    "background": "#0F172A",
    "surface": "#111C2F",
    "textPrimary": "#F8FAFC",
    "textSecondary": "#94A3B8",
    "border": "#263449"
  }
}
```

---

## 15. Accessibility and Internationalization

### Accessibility requirements

- Support dynamic text scaling.
- Provide visible keyboard focus states.
- Use minimum touch targets of 44 × 44 px.
- Announce converted values and refresh statuses to assistive technology.
- Do not rely on flags, color, or symbol shape alone.
- Respect reduced-motion and high-contrast preferences.
- Keep number formatting consistent with the user's locale.

### Internationalization requirements

- Separate currency code, currency name, amount, and symbol in the data model.
- Use locale-aware number formatting.
- Support currencies with zero, two, three, or other valid minor-unit conventions.
- Do not assume the currency symbol appears before the amount.
- Avoid hard-coded decimal separators.
- Keep the product name **OpenCurrency** untranslated unless a local market requires a legal or store-specific alternative.

---

## 16. Launch Checklist

### Brand

- [ ] Finalize wordmark and app icon as vector assets
- [ ] Test icon at 16, 24, 32, 48, 128, 512, and 1024 px
- [ ] Prepare monochrome and high-contrast variants
- [ ] Confirm light and dark logo usage
- [ ] Verify color contrast in production UI

### Product copy

- [ ] Confirm the rate provider and update schedule
- [ ] Replace all uses of “live” if rates are daily
- [ ] Add the rate date and provider attribution
- [ ] Add the informational-rate disclaimer
- [ ] Review error, offline, and stale-data messages

### Legal and distribution

- [ ] Search relevant trademark databases
- [ ] Check app-store name availability
- [ ] Check package registries and repository names
- [ ] Check preferred domains and social handles
- [ ] Review data-provider attribution requirements
- [ ] Publish open-source and third-party licenses

### Technical

- [ ] Implement locale-aware currency formatting
- [ ] Add cached-rate behavior if offline use is supported
- [ ] Test keyboard and screen-reader navigation
- [ ] Respect system theme and reduced-motion settings
- [ ] Ensure no hidden rate markup is applied

---

## 17. Brand Summary

**Name:** OpenCurrency  
**Descriptor:** Simple Currency Converter  
**Tagline:** Currency conversion, without the clutter.  
**Primary color:** `#2563EB`  
**Accent color:** `#14B8A6`  
**Light background:** `#F8FAFC`  
**Dark background:** `#0F172A`  
**Primary typeface:** Inter  
**Brand character:** Simple, open, transparent, lightweight, neutral, dependable  
**Product category:** Currency calculation utility  
**Not positioned as:** Exchange service, trading platform, bank, wallet, or remittance product