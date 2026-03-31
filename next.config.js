
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'hovanhoa.net',
            },
            {
                protocol: 'https',
                hostname: 'i.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'mosaic.scdn.co',
            },
            {
                protocol: 'https',
                hostname: '*.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'image.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'fb-cdn.fra0.pdl.stream',
            },
        ],
    }, 
    // redirects: async () => {
    //     return [
    //         {
    //             source: '/the-complete-developers-guide-to-eigenlayers-avs',
    //             destination: '/the-complete-developers-guide-to-avs',
    //             permanent: true,
    //         },
    //     ];
    // }

};

module.exports = nextConfig;
