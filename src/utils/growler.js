import growlers from '../data/growlers'
import { normalizePath } from './secondary-nav'

export function resolveGrowler(pathname) {
	const current = normalizePath(pathname)
	return growlers.find((growler) => growler.paths.some((path) => normalizePath(path) === current)) ?? null
}
