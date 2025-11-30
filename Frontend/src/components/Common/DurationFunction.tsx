export const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return hours + ' hour' + (hours > 1 ? 's' : '') +
            (remainingMinutes > 0 ? ' ' + remainingMinutes + ' minute' + (remainingMinutes > 1 ? 's' : '') : '');
    } else {
        return minutes + ' minute' + (minutes > 1 ? 's' : '');
    }
}