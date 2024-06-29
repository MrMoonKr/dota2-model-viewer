const {
    DOTA2_DIR_VPK_PATH = 'D:/SteamLibrary/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk',
    PORT = 3000,
    VRF_DECOMPILER_PATH = './vrf/Decompiler.exe',
    VRF_EXTRACT_PATH = './extract/',
    WEBPACK_MIDDLEWARE = false,
} = process.env;

export default {
    DOTA2_DIR_VPK_PATH,
    PORT,
    VRF_EXTRACT_PATH,
    VRF_DECOMPILER_PATH,
    WEBPACK_MIDDLEWARE,
};
