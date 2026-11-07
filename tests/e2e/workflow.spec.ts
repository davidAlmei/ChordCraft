import { test, expect } from '@playwright/test';

test.describe('End-to-end critical workflows', () => {
  test('Complete musician workflow: create, paste lyrics, place chords, format, reload, export PDF', async ({ page }) => {
    // 1. Open the app
    await page.goto('/');
    await expect(page).toHaveTitle(/ChordCraft/i);

    // Verify Library rendered with New Song button
    const newSongBtn = page.getByRole('button', { name: /new song/i });
    await expect(newSongBtn).toBeVisible();

    // 2. Create a song
    await newSongBtn.click();
    await page.waitForURL(/\/songs\/song_/);
    await expect(page.getByPlaceholder('Song Title')).toBeVisible();

    // Set song title and artist
    const titleInput = page.getByPlaceholder('Song Title');
    await titleInput.fill('My Test Hymn');
    await titleInput.press('Enter');

    // 3. Paste lyrics via dialog
    const pasteLyricsBtn = page.getByRole('button', { name: /paste lyrics/i });
    await pasteLyricsBtn.click();
    await expect(page.getByText('Paste Song Lyrics')).toBeVisible();

    const textarea = page.getByPlaceholder(/Amazing grace/i);
    await textarea.fill('[Verse 1]\nMy Jesus, my Saviour\nLord there is none like You');

    const importBtn = page.getByRole('button', { name: /import lyrics/i });
    await importBtn.click();

    // Verify lyrics appear on canvas
    await expect(page.locator('input[value="My Jesus, my Saviour"]')).toBeVisible();
    await expect(page.locator('input[value="Lord there is none like You"]')).toBeVisible();

    // 4. Add chords at character positions
    // Click chord area above first line
    const firstLineContainer = page.locator('input[value="My Jesus, my Saviour"]').locator('..').locator('..');
    const chordArea = firstLineContainer.locator('div[title="Click anywhere to place a chord"]');
    await expect(chordArea).toBeVisible();

    // Click near beginning (offset 0)
    await chordArea.click({ position: { x: 5, y: 10 } });
    await expect(page.getByText('Place Chord')).toBeVisible();

    // Enter chord 'G'
    const chordInput = page.getByPlaceholder(/e\.g\. Am7/i);
    await chordInput.fill('G');
    const saveChordBtn = page.getByRole('button', { name: /save/i });
    await saveChordBtn.click();

    // Verify 'G' appears
    await expect(firstLineContainer.getByText('G')).toBeVisible();

    // Add second chord 'D/F#' between words
    await chordArea.click({ position: { x: 75, y: 10 } });
    await expect(page.getByText('Place Chord')).toBeVisible();
    await chordInput.fill('D/F#');
    await saveChordBtn.click();
    await expect(firstLineContainer.getByText('D/F#')).toBeVisible();

    // 5. Edit lyrics and verify stability
    const lyricInput = page.locator('input[value="My Jesus, my Saviour"]');
    await lyricInput.focus();
    // Move to end and append text
    await lyricInput.press('End');
    await lyricInput.type(' forever');
    await expect(page.locator('input[value*="My Jesus, my Saviour"]')).toBeVisible();
    // Chords are still present!
    await expect(firstLineContainer.getByText('G')).toBeVisible();
    await expect(firstLineContainer.getByText('D/F#')).toBeVisible();

    // 6. Change formatting / spacing
    const formatBtn = page.getByRole('button', { name: /format/i });
    await formatBtn.click();
    await expect(page.getByText('Formatting & Page Layout')).toBeVisible();

    // 7. Save and reload
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);

    await page.reload();
    await expect(page.getByPlaceholder('Song Title')).toHaveValue('My Test Hymn');
    await expect(page.locator('input[value*="My Jesus, my Saviour"]')).toBeVisible();
    await expect(page.getByText('G')).toBeVisible();
    await expect(page.getByText('D/F#')).toBeVisible();

    // 8. Export PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export pdf/i }).click(),
    ]);

    // 9. Confirm that the downloaded file exists and is a valid PDF
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
