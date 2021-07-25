declare var __videoplayer: {
    play(): void
    duration(): number
    replace(url: string): void
    originalCurrentTime(): number
    paused(): boolean
    pause(): void
}