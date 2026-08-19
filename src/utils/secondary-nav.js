const secondaryNavTree = [
	{
		id: 'm-gate',
		label: 'M-GATE',
		href: '/m-gate',
		children: [
			{ id: 'm-gate-leaderboard', label: 'Leaderboard', href: '/m-gate/leaderboard' },
			{ id: 'm-gate-by-language', label: 'By language', href: '/m-gate/by-language' },
			{ id: 'm-gate-by-model', label: 'By model', href: '/m-gate/by-model' },
			{ id: 'm-gate-economics', label: 'Economics', href: '/m-gate/economics' },
			{ id: 'm-gate-methodology', label: 'Methodology', href: '/m-gate/methodology' },
			{ id: 'm-gate-insights', label: 'Insights', href: '/m-gate/insights' },
			{ id: 'm-gate-register', label: 'Register', href: '/m-gate/register' },
		],
	},
	{
		id: 'localization-services',
		label: 'Localization services',
		href: '/what-we-do/localization-services',
		children: [
			{
				id: 'translation-services',
				label: 'Translation services',
				href: '/what-we-do/localization-services/translation-services',
				children: [
					{
						id: 'translation-language',
						label: 'Translation & language',
						href: '/what-we-do/localization-services/translation-services/translation-language',
					},
					{
						id: 'video-audio',
						label: 'Video & audio',
						href: '/what-we-do/localization-services/translation-services/video-audio',
						children: [
							{
								id: 'video',
								label: 'Video',
								href: '/what-we-do/localization-services/translation-services/video-audio/video',
							},
							{
								id: 'audio',
								label: 'Audio',
								href: '/what-we-do/localization-services/translation-services/video-audio/audio',
							},
						],
					},
				],
			},
			{
				id: 'creative-digital-content',
				label: 'Creative & digital content',
				href: '/what-we-do/localization-services/creative-digital-content',
			},
		],
	},
]

const normalizePath = (path = '/') => {
	if (!path) return '/'
	const trimmedPath = path.split('?')[0].split('#')[0]
	if (trimmedPath.length > 1 && trimmedPath.endsWith('/')) {
		return trimmedPath.slice(0, -1)
	}
	return trimmedPath || '/'
}

const findPathToNode = (nodes, targetPath, trail = []) => {
	for (const node of nodes) {
		const nextTrail = [...trail, node]
		if (normalizePath(node.href) === targetPath) return nextTrail
		if (node.children?.length) {
			const found = findPathToNode(node.children, targetPath, nextTrail)
			if (found) return found
		}
	}
	return null
}

const toBreadcrumbs = (pathNodes, currentPath) => {
	const isLeafNode = (node) => !node.children?.length
	const filtered = pathNodes.filter((node, index) => {
		if (index !== pathNodes.length - 1) return true
		return !isLeafNode(node)
	})

	return filtered.map((node) => ({
		label: node.label,
		href: node.href,
		isCurrent: normalizePath(node.href) === currentPath,
	}))
}

const toSubLinks = (currentNode, parentNode) => {
	const source = currentNode.children?.length ? currentNode.children : (parentNode?.children ?? [])
	return source.map((node) => ({
		label: node.label,
		href: node.href,
	}))
}

export const resolveSecondaryNav = (pathname) => {
	const currentPath = normalizePath(pathname)
	const pathNodes = findPathToNode(secondaryNavTree, currentPath)
	if (!pathNodes) return null

	const currentNode = pathNodes[pathNodes.length - 1]
	const parentNode = pathNodes[pathNodes.length - 2]

	return {
		breadcrumbs: toBreadcrumbs(pathNodes, currentPath),
		links: toSubLinks(currentNode, parentNode),
		current: {
			label: currentNode.label,
			href: currentNode.href,
		},
		parent: parentNode
			? {
					label: parentNode.label,
					href: parentNode.href,
				}
			: null,
	}
}

export { normalizePath, secondaryNavTree }
