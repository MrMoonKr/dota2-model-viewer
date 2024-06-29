import express from 'express';
import morgan from 'morgan';

import MurmurHash from './utils/MurmurHash.js';
import ValveResourceFormat from './ValveResourceFormat.js';
import config from './config.js';
import parseKeyValues from './parseKeyValues.js';
import webpackDevMiddleware from './middleware/webpack.js';

const app = express();

// Integration layer with Valve Resource Format to extract Dota 2 game files
const vrf = new ValveResourceFormat(
    config.DOTA2_DIR_VPK_PATH,
    config.VRF_DECOMPILER_PATH,
    config.VRF_EXTRACT_PATH,
);

// Extract and normalize the Dota 2 portrait definitions
const portraits = parseKeyValues( vrf.fetch( 'scripts/npc/portraits.txt' ) ).Portraits;

// Preload list of all available models
const models = vrf.list( { extension: 'vmdl_c' } ).map( ( model ) => ( model.replace( '.vmdl_c', '.vmdl' ) ) );
console.log( '[정보] 모델수 : ' + models.length );

app.use( morgan( 'dev' ) );

if ( config.WEBPACK_MIDDLEWARE === 'true' ) {
    app.use( webpackDevMiddleware() );
}
app.use( express.static( 'public' ) );

// The latest VRF version no longer supports bundling textures into a single GLB
// model file, but rather places these auxiliary files right next to it. To allow
// the model viewer to access these files, we expose this folder fully.
app.use( express.static( config.VRF_EXTRACT_PATH ) );

app.get( '/api/list', ( req, res ) => {

    //const jsonList = JSON.stringify( models );
    //res.send( jsonList );
    //res.json( jsonList );
    res.send( models );
})

app.get( '/api/list/heroes', ( req, res ) => {

    const heroes = models.filter( ( model ) => model.includes( 'models/heroes/' ) ) ;
    res.send( heroes );

    console.log( '[정보] Heroes : ' + heroes.length );

})

app.get( '/api/list/creeps', ( req, res ) => {

    const creeps = models.filter( ( model ) => model.includes( 'models/creeps/' ) ) ;
    res.send( creeps );

    console.log( '[정보] Creeps : ' + creeps.length );

})

app.get( '/api/list/:type', ( req, res ) => {

    const mdls = models.filter( ( model ) => model.includes( 'models/' + req.params.type ) ) ;
    res.send( mdls );

    console.log( `[정보] ${ req.params.type } : ` + mdls.length );

})


// Lists all models
app.get( '/models.json', ( _, res ) => {
    console.log( '[정보] 모델수 : ' + models.length );
    res.send( models );
} );

// Fetches model with given ID, a Murmur resource hash
app.get( '/models/:id(\\d+)n?.json', ( req, res ) => {
    const bid = BigInt( req.params.id );
    for ( const model of models ) {
        const hash = MurmurHash.hash64( model );
        if ( hash === bid ) {
            res.send( {
                model
            } );
            return;
        }
    }
    res.status( 404 ).send( {
        model: null
    } );
} );

// Lists all known portrait definitions
app.get( '/portraits.json', ( _, res ) => {
    res.send( portraits );
} );

// Fetches the portrait definition (if any) for given model or identifier
app.get( '/portraits/:model([a-zA-Z0-9/._-]+).json', ( req, res ) => {

    const { model } = req.params;
    console.log( '[정보] 요청된 초상화 모델 : ' + model );

    if ( model in portraits ) {
        res.send( portraits[ model ] );
    } 
    else {
        res.status( 404 ).send( {
            error: 'Not Found'
        } );
    }
} );

// Fetches given VMDL model as a glTF binary resource
app.get( '/:model([a-zA-Z0-9/_-]+.vmdl).glb', ( req, res ) => {

    const { model } = req.params;
    console.log( '[정보] 요청된 모델 : ' + model );

    if ( models.includes( model ) ) {
        res.contentType( 'model/gltf-binary' );
        res.send( vrf.fetch( model ) );
    } 
    else {
        res.status( 404 ).send( {
            error: 'Not Found'
        } );
    }
} );

// Fetches primary texture for given material
app.get( '/:material([a-zA-Z0-9/_-]+.vmat).png', ( req, res ) => {

    const { material } = req.params ;
    console.log( '[정보] 요청된 재질 : ' + material );

    const kv = parseKeyValues( vrf.fetch( material.toLowerCase() ) );

    // TODO: Is it always called Layer0?
    // const data = kv['Layer0']['VRF Original Textures']['g_tColor'];
    // if ( !data ) {
    //     data = kv['Layer0']['Compiled Textures']['g_tColor'];
    //     if ( !data ) {
    //         res.status( 404 ).send( {
    //             error: 'Not Found'
    //         } );
    //         return;
    //     }
    // }
    let data ;
    if ( kv.hasOwnProperty( 'Layer0' ) ) {
        const layer0 = kv.Layer0;
        if ( layer0.hasOwnProperty( 'VRF Original Textures' ) ) {
            data = layer0['VRF Original Textures'].g_tColor;
        }
        else if ( layer0.hasOwnProperty( 'Compiled Textures' ) ) {
            data = layer0['Compiled Textures'].g_tColor;
        }
        else
        {
            res.status( 404 ).send( {
                error: 'Not Found'
            } );
            return;
        }
    }
    else
    {
        res.status( 404 ).send( {
            error: 'Not Found'
        } );
        return;
    }

    const texture = vrf.fetch( data );
    
    //const texture = vrf.fetch( kv.Layer0.g_tColor );
    //const texture = vrf.fetch( kv.Layer0.VRFOriginalTextures.g_tColor );
    //const texture = vrf.fetch( kv.Layer0.TextureColor );

    res.contentType( 'image/png' );
    res.send( texture );
} );

app.get( '*', ( _, res ) => {
    res.status( 404 ).send( {
        error: 'Not Found'
    } );
} );


export default app;
export { portraits, vrf };
