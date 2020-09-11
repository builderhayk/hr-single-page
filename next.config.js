const withCSS = require('@zeit/next-css')
const withSass = require('@zeit/next-sass')

const isProd = process.env.NODE_ENV === 'production'

// fix: prevents error when .less files are required by node
if (typeof require !== 'undefined') {
    require.extensions['.less'] = file => { }
}

module.exports = withSass(withCSS({
    lessLoaderOptions: {
        javascriptEnabled: true
    }
}));