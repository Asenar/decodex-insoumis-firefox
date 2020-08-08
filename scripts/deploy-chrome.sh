#!/bin/bash

# TODO:
# * functions to define more options:
# --stash-first (stash before deploy, test mode mode only)
# --skip-delete (do not delete files in scripts/)
# * create only one deploy file to make the both jobs

# Validation (require json_pp)
#cat manifest.json|json_pp
#if [[ $? ]]; then
#    echo "syntax error manifest.json"
#    exit 128
#fi


### {{{ verbose functions ###
## http://www.ludovicocaldara.net/dba/bash-tips-4-use-logging-levels/

colblk='\033[0;30m' # Black - Regular
colred='\033[0;31m' # Red
colgrn='\033[0;32m' # Green
colylw='\033[0;33m' # Yellow
colpur='\033[0;35m' # Purple
colrst='\033[0m'    # Text Reset

silent_lvl=0
crt_lvl=1
ntf_lvl=1
err_lvl=2
wrn_lvl=3
inf_lvl=4
dbg_lvl=5

verbosity=5 # default to show warnings

## esilent prints output even in silent mode
function esilent ()  { verb_lvl=$silent_lvl elog "$@" ;}
function enotify ()  { verb_lvl=$ntf_lvl elog "$@" ;}
function eok ()      { verb_lvl=$ntf_lvl elog "${colgrn}$@${colrst}" ;}
function ewarn ()    { verb_lvl=$wrn_lvl elog "${colylw}${@}${colrst}" ;}
function einfo ()    { verb_lvl=$inf_lvl elog "${colwht}${@}${colrst}" ;}
function edebug ()   { verb_lvl=$dbg_lvl elog "${colgrn}${@}${colrst}" ;}
function eerror ()   { verb_lvl=$err_lvl elog "${colred}${@}${colrst}" ;}
function ecrit ()    { verb_lvl=$crt_lvl elog "${colpur}${@}${colrst}" ;}
function edumpvar () { for var in $@ ; do edebug "$var=${!var}" ; done }
function elog() {
        if [[ $verbosity -ge $verb_lvl ]]; then
                #datestring="`date +"%Y-%m-%d %H:%M:%S"` - "
                echo -e "${datestring}${@}"
        fi
}
#ewarn "this is a warning"
#eerror "this is an error"
#eok "this is an ok message"
#einfo "this is an information"
#edebug "debugging"
#ecrit "CRITICAL MESSAGE!"



### }}} verbose functions ###


### INIT ###
# if true, base_url set to http://localhost/database.json
opt_local=false

# if true, base_url set to http://localhost/database.json
opt_deploy=false

# publish releases (works only if tags)
opt_publish=true

# delete files (delete files to exclude them from package)
opt_delete=true
filesToRemove="manifest-firefox.json manifest-chrome.json scripts/deploy-firefox.sh scripts/deploy-chrome.sh"

opt_verbose=false

echo "start while"
while [[ $# -gt 0 ]]; do
    option="${1#--}"
    option="${option#-}"

    case "${option}" in
        publish)
            opt_publish=true
            publish=true
            shift
            ;;
        deploy)
            opt_deploy=true
            shift
            ;;
        l|local)
            opt_local=true
            opt_deploy=false
            opt_publish=false
            deploy=false
            shift
            ;;
        delete)
            opt_delete=true
            shift
            ;;
        q|quiet)
            opt_verbose=false
            verbosity=$silent_lvl
            shift
            ;;
        v|verbose)
            opt_verbose=true
            verbosity=$inf_lvl
            shift
            ;;
        vv|very-verbose)
            opt_verbose=true
            verbosity=$dbg_lvl
            shift
            ;;
        *)
            echo "unknown option"
            # unknown option
            shift
            ;;
    esac
done

printf "mode verbose ($verbosity)"
if $opt_verbose; then
    eok " enabled"
else
    eok " disabled"
fi
printf "mode local      "
if $opt_local; then
    eok " enabled"
else
    eok " disabled"
fi
printf "mode delete     "
if $opt_delete; then
    eok " enabled"
else
    eok " disabled"
fi
printf "mode deploy     "
if $opt_deploy; then
    eok " enabled"
else
    eok " disabled"
fi
printf "mode publish    "
if $opt_publish; then
    eok " enabled"
else
    eok " disabled"
fi


release_path=build/
file_prefix=possedex
platform_name=$(basename $0|sed "s/deploy-\(.*\).sh/\1/");
if [[ "$platform_name" == "chrome" ]];then
    extension='zip'
else
    extension='xpi'
fi



tag=$(git describe --exact-match --tags HEAD)
einfo "tag : $tag"

gitstatus=$(git status -s)
if [ -n "$gitstatus" ]; then
    if $opt_delete; then
        git status -s
        eerror "Aborting (repo not clean, some files may be deleted)…"
        exit 1;
    fi
fi

if [ -z "$tag" ]; then
    einfo "missing version number. set version to 0.0.0.0";
	tag=0.0.0.0
	publish=false
fi

version=$tag

filename_release_path=build/${file_prefix}-${platform_name}-${tag}.${extension}

# {{{ begin build manifest.json
cp manifest-${platform_name}.json manifest.json

einfo "set version $version in manifest.json";
sed -i "s/{VERSION}/${version}/" manifest.json

if $opt_local;then
    einfo "create background-local.js and set database url to localhost"
    sed "s#http://possedex.info#localhost#" background.js > background-local.js
    einfo "set _debug=5"
    sed -i "s#var _debug = .*;#var _debug = 5;#" background-local.js
    einfo "update manifest.json to use background-local.js"
    sed -i "s#background.js#background-local.js#" manifest.json
fi
# }}} end build manifest.json

node -c background.js
if [[ $? -ne 0 ]]; then
    eerror "syntax error background.js"
    exit 128
fi

node -c install.js
if [[ $? -ne 0 ]]; then
    eerror "syntax error install.js"
    exit 128
fi

node -c popup/popup.js
if [[ $? -ne 0 ]]; then
    eerror "syntax error popup.js"
    exit 128
fi

node -c content.js
if [[ $? -ne 0 ]]; then
    eerror "syntax error content.js"
    exit 128
fi

no_tag=$?
if [[ $no_tag -ne 0 ]]; then
    ewarn "No tag found in current HEAD. Do not deploy."
    exit 0;
fi

if [[ -z "$tag" ]]; then
    ewarn "invalid tag (it should contains «chrome-»). Do not deploy."
    exit 0;
fi

version=$(cat manifest.json|grep $tag|awk -F\" '{print $4}');
if [[ -z "$version" ]]; then
    eerror "version missing in manifest.json. Deploy aborted."
    exit 0;
fi

if [[ "$version" != "$tag" ]]; then
    eerror "Mismatch version: manifest=${version}, tag=${tag}. Do not deploy";
    exit 0;
fi
einfo "version in manifest matches tag : ${tag}. Deploy can happens."

if [[ ! -d build ]]; then
    mkdir build
fi

# {{{ platform specific -- prepare to publish
# todo: lint

if [[ false == $opt_publish ]]; then
    zip_opts="--quiet"
fi

zip -r $zip_opts ${filename_release_path} ./* \
    --exclude \*script* manifest-chrome.json manifest-firefox.json \*build/* \*web-ext-artifacts/*

error=$?
if [[ $error -ne 0 ]]; then
    eerror "error during zip operation";
    exit $error;
else
    eok "zip archive successfully created";
fi

# mv

# }}} platform specific

if $opt_delete; then
    edebug "opt_delete found"
    if [[ -n "$filesToRemove" ]]; then
        ewarn "deleting ${filesToRemove} is not really required for google"
        #git clean -f -d *
        rm ${filesToRemove}
    fi
else
    ewarn "/!\ unnessessary files may be part of the package"
    einfo "$filesToRemove"
fi

if [[ false == $opt_publish ]]; then
    einfo "option --publish missing."
    exit 0
fi

if [[ $publish == false ]];then
    ewarn "--publish option found but no tag found."
    exit 0
fi

eok "publication de l'extension sur $platform_name"

# {{{ platform specific
# see https://github.com/pastak/chrome-webstore-manager
webstore_token=$(chrome-webstore-manager refresh_token --client_id $GOOGLE_CLIENT_ID --client_secret $GOOGLE_CLIENT_SECRET --refresh_token $GOOGLE_REFRESH_TOKEN)
webstore upload --source $filename_release_path --extension-id $GOOGLE_APP_ID \
    --client-id $GOOGLE_CLIENT_ID --client-secret $GOOGLE_CLIENT_SECRET \
    --refresh-token $webstore_token --autopublish

# }}} platform specific

error=$?
if [[ $error -ne 0 ]]; then
    eerror "une erreur est survenue (error: $error)"
    git checkout .
    if [[ $error -eq 1 ]]; then
        exit 0
    fi
    exit $error
else
    eok "une nouvelle version de l'extension a été envoyée."
fi

ewarn "restore repository"
git checkout .
