/*          POSSEDEX
            VERSION 1 / MARS 2017
            VERSION 2 / JANVIER 2018
            REMERCIEMENT A L'EQUIPE LES DECODEURS DU MONDE
            REMERCIEMENT AUX INSOUMIS QUI SE RECONNAITRONT
                             .y.
                            -dMm.
                           .mMMMd.
                          .dMMMMMd.     .:+oyyso-
                         `hMMMMMMMd` -odNMMMMMMMNy`             `..
                         sMMMm:dMMMddNMMMMmyoomMMMh    `.-/+oydmmN:
                        :NMMN/ .mMMMMMNd+-`   -NMMMyydmNNNMMMMMMMd.
                        hMMMy   -mMMMN:        sMMMMMMMMNNmhhNMMMo
                       -mMMM-    -mMMMy`       -NMMMy+/-.`` /NMMN.
                       /NMMM`     -mMMMy`      `hMMM+       sMMMh
                       -mMMMo`     :mMMMs`      sMMMd      .NMMN/
                        +NMMNy`     :NMMNs      /MMMm`     +MMMd.
                         :dMMMd:     :NMMMo`    `NMMN-    `dMMMo
                          .yMMMN+     :NMMNo     NMMN/    /NMMM.
                           `oNMMNy.    /NMMN+    dMMMo    yMMMh
                             :mMMMd-    /NMMN+   yMMMs   `NMMN/
                         `-://ohhhhy+////ymNMN/.-shhds:--+mmmd.
                       `/osoo+++++++++++oosshdsssoooooooooosss+/-`
                      `+so/:::::::::::::::/osss+:::::::::::://+os+-`
                      -ss/:----------------/ss+:--------------::+ss+-.```
                      .ss+:::::::--::::::::+sso::---------------::+osoooo-
                      `+sso+++///::::///+++oosso+//:::::::--------:::/+ss-
                     `/ss+/::::::::::::::::::+ssssoooooo+:------------/ss-
                     .os+:-------------------:oso-....os+-------------/ss-
                     `+so::----------:::::://+ss+`    +so:------------/ss-
                      .+so+////////:::::////+++os+.   -ss/------------/ss-
                       `-oso//:::::------------:os+   `/so/:----------/ss-
                        `oso:-----------------::oso    `+so/:---------/ss-
                         :ss+:::::::::::::::://+oss/.  ``/so+:--------/ss-
                          -+osoooooo++///::::::::/+so- -.`:oso/::-----/ss-
                            .-:::oso:-------------:os+` o+ `:oso+/::::/ss-
                                 /so/:------------:os+` /Ms. `-+ysssoooss-
                                 `+so+/:::::::::/+oso.  +MMd-  .hNmmh----`
                                  `:+oooossssooooo+:`   yMMMy`  -MMMN/
                                     `..:dmmm/...`      :NMMM:   sMMMm`
                                        :MMMm.           yMMMh   .dMMMs
                                        yMMMy       ``.:+yMMMN:   :NMMN:
                                       `mMMM/  ``-+shmMMMMMMNNy    sMMMm`
                                       /NMMN-:ohmMMMMNNmdyo+/--    .mMMMo
                                       sMMMMmMMMMNmyo/.`   `.:/+ossodMMMN:
                                      .mMMMMMNmy+.`    `-+ymNMMMMMMMMMMMMd`
                                      :MMMMNs:`  ``./oymNMMMMNdhyssyhmMMMMo
                                      yMMMNyoooyhdNNMMMMNMMMMo`      `dMMMd`
                                      -dNMMMMMMMMMNNNdy+:oMMMN:    `:hMMMN:
                                       `:+syyyyso/:.`     yMMMm` `/dMMMMd:
                                                          .dMMMhomMMMNh/
                                                           -NMMMMMMNy-
                                                            +NMMMms.
                                                             sMmo`
                                                             `/`

*/

var browser = browser || chrome;

var max_notes = 6;  // (de 0 à 5 = 6 notes)

var options_infobulles = ['inconnu', 'capital', 'etat', 'independant' ];
var checkbox_options = ['persist' ];
var options_others     = ['persist' ];

function optionStore(e){
    var infobulles;
    var classement = this.id.replace("check-", "");
    var checked = this.checked;

    if (classement == 'persist') {
        browser.storage.local.set({
            'persist': checked
        });
    } else {
        browser.storage.local.get('infobulles', function(results){
            infobulles = results.infobulles;
            infobulles[classement] = checked;
            browser.storage.local.set({
                'infobulles': infobulles
            });
        });
    }
}

function refreshDatabase(e){
    browser.extension.getBackgroundPage().reloadAndStoreDB();
    return false;
}

function linkInNewTab(a) {
	var href = a.href; // une fermeture ... sinon ça ne marche pas si le <a> contient par exemple une <img>
	a.addEventListener('click', function(e){
		if (href!==undefined) {
			browser.tabs.create({url:href});
			window.close();
		}
		e.preventDefault();
	});
	return a;
}

function createLink(toDOM,url,title) {
    var a = document.createElement("a");
	a.href = url; a.innerText = title;
	linkInNewTab(a);
	toDOM.appendChild(a);
	return a;
}

function main() {
    // retrieve all datas from background.js
    // var background = browser.extension.getBackgroundPage();
    const background = browser.extension.getBackgroundPage();
    const Possedex = background.Possedex;
    const entity = background.Possedex.current_entity;

    // document.querySelector("#verif-insoumis").style.display = "block";
    document.querySelector("#possedex-window").classList.remove('active');
    // document.querySelector("#verif-insoumis").classList.add("active");
    document.querySelector("#possedex-window").style.display = "none";
    if(entity !== null) {
        // TODO afficher les infos manquantes avec popup.js et popup.html
        document.querySelector(".content #site-name").innerText = entity.nom;
        // document.querySelector("#notule").innerText = entity.notule;
        //document.querySelector("#last-update").style["color"] = entity.color;
        //document.querySelector("#last-update").style["color"] = entity.color;
        document.querySelector("#desc").innerText = entity.possedex.desc;
        document.querySelector("#link-detail").href = "https://www.possedex.info/#"+entity.nom;
        const updated = new Date();
        updated.setTime(Date.parse(entity.possedex.updated));
        document.querySelector("#last-update-date").innerText = updated.toLocaleDateString('fr')

        const proprietairesContainer = document.querySelector("#proprietaires span.content");
        proprietairesContainer.innerText = '';

        for (let i in entity.proprietaires) {
            createLink(proprietairesContainer,
                "https://possedex.info/#"+entity.proprietaires[i].nom,
                entity.proprietaires[i].nom
            )
            proprietairesContainer.innerHTML += ", ";
        }
        proprietairesContainer.innerHTML = proprietairesContainer.innerHTML
            .substring(0, proprietairesContainer.innerHTML.lastIndexOf(', ')
        );

        //for(var i in entity.est_possede) {
        //    if (!entity.est_possede[i]) {
        //        //document.querySelector("#proprietaire"+i).style = "display:none";
        //    } else {
        //        document.querySelector("#proprietaire"+i).style = "";
        //        document.querySelector("#proprietaire"+i+" .nom").innerText
        //            = entity.est_possede[i].nom + "("+entity.est_possede[i].value+")"
        //    }
        //    if (!background.fortunes[i]) {
        //        document.querySelector("#proprietaire"+i+" td.detail").style = "display:none";
        //    } else {
        //        if (background.fortunes[i].length) {
        //            document.querySelector("#proprietaire"+i+" td.detail .d1").innerText = background.fortunes[i]
        //        } else {
        //            document.querySelector("#proprietaire"+i+" td.detail .d1").style = "display:none";
        //        }
        //        if (background.marques[i].length) {
        //            document.querySelector("#proprietaire"+i+" td.detail .d2").innerText = "[marque] "  + background.marques[i]
        //        } else {
        //            document.querySelector("#proprietaire"+i+" td.detail .d2").style = "display:none";
        //        }
        //        if (background.influences[i].length) {
        //            document.querySelector("#proprietaire"+i+" td.detail .d3").innerText = "[secteur] " + background.influences[i]
        //        } else {
        //            document.querySelector("#proprietaire"+i+" td.detail .d3").style = "display:none";
        //        }
        //        document.querySelector("#proprietaire"+i+" td.detail").style = "";
        //    }
        //}

        //document.querySelector("#fortunes span.content").innerText = background.fortunes.join(",");
        //document.querySelector("#brands span.content").innerText = background.marques.join(",");
        //document.querySelector("#influences span.content").innerText = background.influences.join(",");


        //document.querySelector("#interests span.content").innerText = background.interets;
        //document.querySelector("#conflicts span.content").innerText = background.conflits;
        //document.querySelector("#subsidies span.content").innerText = background.subventions;

        const source_wrapper = document.querySelector("#sources");
        const target_sources = document.querySelector("#sources .content");
        target_sources.innerText = "";

        if (entity.possedex.sources.length === 0) {
            source_wrapper.style.display = "none";
        }
        else {
            source_wrapper.style.display = "block";
            entity.sources.forEach((el, i) => {
                createLink(target_sources, el.url, el.title);
            })
        }

        // background.sources.forEach(function(obj, i){
        //});


        document.querySelector("#possedex-window").style.display = "block";
        // document.querySelector("#verif-insoumis").classList.remove("active");
        document.querySelector("#possedex-window").classList.add('active');
        document.querySelector("#more-info").href = "http://www.acrimed.org/+-"+entity.slug.replace(/ /,'-')+"-+";
        //var site_url = entity.site_url;
        //document.querySelector("#more-info").href = "http://www.possedex.info/#"+site_url;
    }

    // {{{ set the cog button
    var params = document.querySelector("#params");
    params.addEventListener("click", function(){
        var parameters = document.querySelector("#parameters");
        if(params.classList.contains("active-p")) {
            params.classList.remove("active-p");
            parameters.style.display = "none";
            document.querySelector(".active").style.display = "block";
        }
        else {
            params.classList.add("active-p");
            document.querySelector(".active").style.display = "none";
            parameters.style.display = "block";
        }
    });
    // }}} set the cog button

    // {{{ get config info to display in view
    browser.storage.local.get(['persist'], function(results){
        var infobulles = results.infobulles;
        var persist = document.getElementById('check-persist');
        if(results.persist == true){
            persist.checked = true;
        } else {
            persist.checked = false;
        }
    });

    // }}} get config info to display in view

} // end of main function

document.addEventListener('DOMContentLoaded', function () {
    main();
    checkbox_options.forEach(function(element_id) {
        var element = document.getElementById('check-' + element_id);

        element.addEventListener('click', optionStore);
    });
    document.querySelector('#do-refresh-database').addEventListener('click', function(e) {
        refreshDatabase();
    });
});

function getObjectKeys(obj) {
    const keys = [];
    for(let key in obj){
        keys.push(key);
    }
    return keys;
}
