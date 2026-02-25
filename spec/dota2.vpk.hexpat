#pragma endian little
#pragma pattern_limit 0x400000


import std.io;
import std.mem;
import std.string;


//------------------------------------------------------------------------------

const u32 VPK_SIGNATURE         = 0x55AA1234;
const u16 VPK_ENTRY_TERMINATOR  = 0xFFFF;


//------------------------------------------------------------------------------

struct VPKString {
    char    m_Name[while(std::mem::read_unsigned($,1) != 0x00)];
    u8      m_End[[hidden]];
    if ( m_Name == "" ) {
        break;
    }
}[[name(this.m_Name)]];

//------------------------------------------------------------------------------

struct VPKHeaderV2 {
    u32     signature;
    u32     version;
    u32     tree_size;
    u32     file_data_section_size;
    u32     archive_md5_section_size;
    u32     other_md5_section_size;
    u32     signature_section_size;
}[[name(VPKHeaderV2_Name(this))]];

fn VPKHeaderV2_Name(auto data) {
    return std::format("m_Header( Version:{} )", data.version);
};

//------------------------------------------------------------------------------

struct VPKAsset {
    u32     crc32;
    u16     preload_bytes;
    u16     archive_index [[comment("0x7FFF means file payload is in pak01_dir.vpk file-data section")]];
    u32     entry_offset [[comment("Relative to file-data section when archive_index == 0x7FFF, otherwise relative to pak01_###.vpk")]];
    u32     entry_length;
    u16     terminator;
    if (terminator != VPK_ENTRY_TERMINATOR) { // 0xFFFF
        break;
    }
    if (preload_bytes > 0x00) {
        u8  preload_data[preload_bytes];
    }
    if (archive_index == 0x7FFF) {
        //u8  data[entry_length] @ entry_offset;
    }
};

struct VPKFileNode {
    VPKString   m_Name;
    VPKAsset    m_Asset;
}[[name(VPKFileNode_Name(this))]];

fn VPKFileNode_Name(auto data) {
    if ( data.m_Name.m_Name != "" ) {
        return std::format("File( '{}' [..._{:03}.vpk][0x{:x}:0x{:x}] )", 
            data.m_Name.m_Name,
            data.m_Asset.archive_index ,
            data.m_Asset.entry_offset ,
            data.m_Asset.entry_length 
            );
    }
    else {
        return "(END)";
    }
};


//------------------------------------------------------------------------------

struct VPKPathNode {
    VPKString   m_Name;
    VPKFileNode m_Files[while(true)];
}[[name(VPKPathNode_Name(this))]];

fn VPKPathNode_Name(auto data) {
    return std::format("Directory( '{}' )", data.m_Name.m_Name);
};

//------------------------------------------------------------------------------

struct VPKExtensionNode {
    VPKString   m_Name;
    VPKPathNode m_Path[while(true)];
} [[name(VPKExtensionNode_Name(this))]];

fn VPKExtensionNode_Name(auto data) {
    return std::format("Extension( '{}' )", data.m_Name.m_Name);
};

//------------------------------------------------------------------------------

struct VPKArchiveMD5 {
    u32 archive_index;
    u32 starting_offset;
    u32 count;
    u8 md5[16];
};

//------------------------------------------------------------------------------

struct VPKOtherMD5 {
    u8 tree_checksum[16];
    u8 archive_md5_section_checksum[16];
    u8 whole_file_checksum[16];
};

//------------------------------------------------------------------------------

struct VPKFile {

    VPKHeaderV2 m_Header;
    if (m_Header.signature != VPK_SIGNATURE) {
        break;
    }
    if (m_Header.version != 2) {
        break;
    }

    u64 tree_start = $;
    u64 tree_end   = tree_start + m_Header.tree_size;
    VPKExtensionNode m_Tree[while(!std::mem::reached(tree_end))];

    if (m_Header.file_data_section_size > 0) {
        u8 m_FileData[m_Header.file_data_section_size];
    }

    if (m_Header.archive_md5_section_size > 0) {
        u32 md5_entry_count = m_Header.archive_md5_section_size / sizeof(VPKArchiveMD5);
        VPKArchiveMD5 m_ArchiveMD5s[md5_entry_count];

        u32 md5_tail = m_Header.archive_md5_section_size % sizeof(VPKArchiveMD5);
        if (md5_tail > 0) {
            u8 m_ArchiveMD5s_tail[md5_tail];
        }

    }

    if (m_Header.other_md5_section_size == sizeof(VPKOtherMD5)) {
        VPKOtherMD5 m_OtherMD5;
    } else if (m_Header.other_md5_section_size > 0) {
        u8 m_OtherMD5_raw[m_Header.other_md5_section_size];
    }

    if (m_Header.signature_section_size > 0) {
        u8 m_Signature[m_Header.signature_section_size];
    }

    if (!std::mem::eof()) {
        u8 m_Trailing_raw[while(!std::mem::eof())];
    }
};


//------------------------------------------------------------------------------

VPKFile g_VPK @ 0x00;