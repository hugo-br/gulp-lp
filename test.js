//const { readdirSync, statSync } = require('fs')
const fs = require('fs');
const { join } = require('path')
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(join(p, f)).isDirectory())
const masterDirectory = 'dist/landingPage';
const createHTML = require('create-html')

const target = dirs(masterDirectory);
let text = '';
  target.forEach(function(folder) {
	text += `<div class='folder'>`;  
    text += `<h1 class='folder folder--title'>${folder}</h1>
			  <br>`;
	
	// get all files into directory
	fs.readdirSync(masterDirectory+'/'+folder).forEach(file => {
	  text += `<a class='folder folder--link' href='${folder + '/' + file}'>
				 <h4 class='folder folder--title sub'>${file}</h4>
			  </a>
		 <br>`;
	});
	
	text += `</div>`;  
});

var html = createHTML({
  title: 'Quick Links',
  lang: 'en',
  dir: 'ltl',
  head: '<meta name="description" content="example">',
  body: '<p>'+text+'</p>',
  favicon: 'favicon.png'
})
 
fs.writeFile('dist/landingPage/index.html', html, function (err) {
  if (err) console.log(err)
})