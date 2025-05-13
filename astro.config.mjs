import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
    output: 'static',
    trailingSlash: 'always',
    site: 'https://utsavbalar.in',

    // Single page, no prefetch needed
    prefetch: false,

    integrations: [
        tailwind(),
        sitemap(),
        mdx({
            syntaxHighlight: 'shiki',
            shikiConfig: {
                theme: 'one-dark-pro',
                wrap: true,
                langs: [
                    {
                        id: 'dts',
                        scopeName: 'source.devicetree',
                        grammar: {
                            patterns: [
                                {
                                    include: '#comments'
                                },
                                {
                                    match: '\\b[a-zA-Z_][a-zA-Z0-9_]*\\s*:',
                                    name: 'entity.name.tag.dts'
                                },
                                {
                                    match: '\\b(compatible|model|reg|ranges|status|phandle|interrupt-parent|interrupts|dma-ranges|dma-coherent|gpio-controller|#gpio-cells|#interrupt-cells|#clock-cells|clocks|clock-names|resets|reset-names|power-domains|operating-points-v2|cpu-supply|pins|function|groups|pinctrl-[0-9]+|linux,phandle)\\b',
                                    name: 'keyword.other.dts'
                                },
                                {
                                    match: '\\b(#address-cells|#size-cells)\\b',
                                    name: 'keyword.control.dts'
                                },
                                {
                                    match: '\\b(\\d+|0x[0-9a-fA-F]+)\\b',
                                    name: 'constant.numeric.dts'
                                },
                                {
                                    match: '"[^"]*"',
                                    name: 'string.quoted.double.dts'
                                },
                                {
                                    match: '<[^>]*>',
                                    name: 'string.quoted.other.dts'
                                }
                            ],
                            repository: {
                                comments: {
                                    patterns: [
                                        {
                                            match: '/\\*.*?\\*/',
                                            name: 'comment.block.dts'
                                        },
                                        {
                                            match: '//.*$',
                                            name: 'comment.line.double-slash.dts'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            },
            remarkPlugins: [],
            rehypePlugins: []
        }),
        compress({
            CSS: true,
            SVG: false,
            Image: false,
            HTML: {
                "html-minifier-terser": {
                    collapseWhitespace: true,
                    // collapseInlineTagWhitespace: true, // It breaks display-inline / flex-inline text
                    minifyCSS: true,
                    minifyJS: true,
                    removeComments: true,
                    removeEmptyAttributes: true,
                    // removeEmptyElements: true, // It removes sometimes SVGs
                    removeRedundantAttributes: true
                },
            },
            JavaScript: {
                'terser': {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                    }
                }
            }
        })
    ]
});
