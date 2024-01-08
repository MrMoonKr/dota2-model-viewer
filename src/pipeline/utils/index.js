import path from 'path';

export { default as MurmurHash } from './MurmurHash.js';

export const changeExtension = ( fqpath, extension ) => {
    const current = path.extname( fqpath );
    if ( extension && current !== extension ) {
        const dirname = path.dirname( fqpath );
        const basename = path.basename( fqpath, current );
        return path.join( dirname, `${basename}${extension}` );
    }
    return fqpath;
};

export const stripIndent = ( strings, ...params ) => {
    let source = strings.map( ( string, i ) => (
        `${string}${params[i] || ''}`
    ) ).join( '' );

    // See: https://github.com/zspecza/common-tags/blob/master/src/stripIndentTransformer/stripIndentTransformer.js
    const match = source.match( /^[^\S\n]*(?=\S)/gm );
    const indent = match && Math.min( ...match.map( ( el ) => el.length ) );
    if ( indent ) {
        const regexp = new RegExp( `^.{${indent}}`, 'gm' );
        source = source.replace( regexp, '' );
    }

    // Strip leading whitespace and trailing tabs/spaces
    source = source.replace( /^\n+|[ \t]+$/g, '' );

    return source;
};
