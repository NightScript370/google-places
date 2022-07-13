const defaultGooglePlacesSettings = {
	placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' // placeId provided by google api documentation
  , render: ['reviews']
  , min_rating: 0
  , max_rows: 0
  , map_plug_id: 'map-plug'
  , rotateTime: false
  , shorten_names: true
  , schema:{
		displayElement: '#schema'
	  , type: 'Store'
	  , beforeText: 'Google Users Have Rated'
	  , middleText: 'based on'
	  , afterText: 'ratings and reviews'
	  , image: null
	  , priceRange: null
  }
  , address:{
	  displayElement: "#google-address"
	}
  , phone:{
	  displayElement: "#google-phone"
  }
  , staticMap:{
		displayElement: "#google-static-map"
	  , width: 512
	  , height: 512
	  , zoom: 17
	  , type: "roadmap"
  }
  , hours:{
	  displayElement: "#google-hours"
  }
}

class googlePlaces {
	constructor(element, options) {
		this.element = element;
		this.options = Object.assign(defaultGooglePlacesSettings, options);

		this.init();
	}

	init() {
		this.element.innerHTML = `<div id="${this.options.map_plug_id}"></div>`;
		initialize_place((place) => {
			this.options.place_data = place;

			if (this.options.render.indexOf('rating') > -1) {
				this.renderRating(plugin.place_data.rating);
			}

			// render specified sections
			if (this.options.render.indexOf('reviews') > -1){
				this.renderReviews(plugin.place_data.reviews);
			}

			if (this.options.render.indexOf('address') > -1){
				renderAddress(document.querySelector(this.options.address.displayElement), place.adr_address);
			}

			if (this.options.render.indexOf('phone') > -1){
				renderPhone(document.querySelector(this.options.phone.displayElement), place.formatted_phone_number);
			}
			if (plugin.settings.render.indexOf('staticMap') > -1){
				renderStaticMap(document.querySelector(this.options.staticMap.displayElement), place.formatted_address);
			}

			if (plugin.settings.render.indexOf('hours') > -1){
				renderHours(document.querySelector(this.options.settings.hours.displayElement), place.opening_hours);
			}

			// render schema markup
			addSchemaMarkup(document.querySelector(this.options.schema.displayElement), place);

		});
	}

	initialize_place (c){
		const map = new window.google.maps.Map(document.getElementById(this.options.map_plug_id));
		const request = { placeId: this.options.placeId };
		const service = new window.google.maps.places.PlacesService(map);

		service.getDetails(request, function(place, status) {
			if (status == window.google.maps.places.PlacesServiceStatus.OK) {
				c(place);
			}
		});
	}

	sort_by_date (ray) {
		ray.sort(function(a, b){
		  var keyA = new Date(a.time),
		  keyB = new Date(b.time);
		  // Compare the 2 dates
		  if(keyA < keyB) return -1;
		  if(keyA > keyB) return 1;
		  return 0;
		});
		return ray;
	}

	filter_minimum_rating (reviews){
		for (var i = reviews.length -1; i >= 0; i--) {
			if (reviews[i].rating < plugin.settings.min_rating){
				reviews.splice(i,1);
			}
		}
		return reviews;
	}

	renderRating (rating){
		const star = this.renderAverageStars(rating);
		const html = "<div class='average-rating'><h4>"+star+"</h4></div>";
		this.element.innerHTML += html;
	}

	shorten_name (name) {
		if (name.split(" ").length > 1) {
			var xname = "";
			xname = name.split(" ");
			return xname[0] + " " + xname[1][0] + ".";
		}
	}

	renderReviews (reviews){
		reviews = this.sort_by_date(reviews);
		reviews = this.filter_minimum_rating(reviews);
		var html = "";
		var row_count = (this.options.max_rows > 0)? this.options.max_rows - 1 : reviews.length - 1;
		// make sure the row_count is not greater than available records
		row_count = (row_count > reviews.length-1)? reviews.length -1 : row_count;
		for (var i = row_count; i >= 0; i--) {
			var stars = this.renderStars(reviews[i].rating);
			var date = this.convertTime(reviews[i].time);
			if (this.options.shorten_names == true) {
				var name = this.shorten_name(reviews[i].author_name);
			} else {
				var name = reviews[i].author_name + "</span><span class='review-sep'>, </span>";
			};
			html += "<div class='review-item'><div class='review-meta'><span class='review-author'>"+name+"<span class='review-date'>"+date+"</span></div>"+stars+"<p class='review-text'>"+reviews[i].text+"</p></div>"
		};
		this.element.innerHTML += html;
	}

	renderHours (element, data){
		const ulElement = document.createElement("ul");
		data.weekday_text.forEach((day) => {
			const liElement = document.createElement("li");
			liElement.appendChild(document.createTextNode(day));

			ulElement.appendChild(liElement);
		});
		element.append(ulElement);
	}

	renderStaticMap (element, data){
		var map = this.options.staticMap;

		const urlQueries = new URLSearchParams({
			size: `${map.width}x${map.height}`,
			zoom: map.zoom,
			maptype: map.type,
			markers: "size:large%7Ccolor:red%7C"+data
		})

		const imageLink = "https://maps.googleapis.com/maps/api/staticmap" + urlQueries.toString();
		const imgElement = document.createElement('img')
		imgElement.src = imageLink;

		element.append(imgElement);
	}

	renderAddress (element, data){
		element.innerHTML += data;
	}

	renderPhone (element, data){
		element.innerHTML += data;
	}

	renderStars = function(rating){
		let stars = "<div class='review-stars'><ul>";

		// fill in gold stars
		for (let i = 0; i < rating; i++) {
		  stars = stars+"<li><i class='star'></i></li>";
		};

		// fill in empty stars
		if(rating < 5){
		  for (i = 0; i < (5 - rating); i++) {
			stars = stars+"<li><i class='star inactive'></i></li>";
		  };
		}
		stars = stars+"</ul></div>";
		return stars;
	}

	renderAverageStars (rating){
		var stars = "<div class='review-stars'><ul><li><i>"+rating+"&nbsp;</i></li>";
		var activeStars = parseInt(rating);
		var inactiveStars = 5 - activeStars;
		var width = (rating - activeStars) * 100 + '%';

		// fill in gold stars
		for (var i = 0; i < activeStars; i++) {
		  stars += "<li><i class='star'></i></li>";
		};

		// fill in empty stars
		if(inactiveStars > 0){
		  for (var i = 0; i < inactiveStars; i++) {
			  if (i === 0) {
				  stars += "<li style='position: relative;'><i class='star inactive'></i><i class='star' style='position: absolute;top: 0;left: 0;overflow: hidden;width: "+width+"'></i></li>";
			  } else {
				  stars += "<li><i class='star inactive'></i></li>";
			  }
		  };
		}
		stars += "</ul></div>";
		return stars;
	}

	convertTime (UNIX_timestamp){
		var a = new Date(UNIX_timestamp * 1000);
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var time = months[a.getMonth()] + ' ' + a.getDate() + ', ' + a.getFullYear();
		return time;
	}

	addSchemaMarkup (element, placeData) {
		var schema = this.options.schema;
		var schemaMarkup = '<span itemscope="" itemtype="http://schema.org/' + schema.type + '">';

		  if(schema.image !== null) {
			schemaMarkup += this.generateSchemaItemMarkup('image', schema.image);
		  } else {
			console.warn('Image is required for some schema types. Visit https://search.google.com/structured-data/testing-tool to test your schema output.');
		  }

		  if(schema.priceRange !== null) {
			schemaMarkup += this.generateSchemaItemMarkup('priceRange', schema.priceRange);
		  }

		  schemaMarkup += this.generateSchemaItemMarkup('url', location.origin);
		  schemaMarkup += this.generateSchemaItemMarkup('telephone', plugin.place_data.formatted_phone_number );
		  schemaMarkup += this.generateSchemaAddressMarkup();
		  schemaMarkup += this.generateSchemaRatingMarkup(placeData, schema);
		  schemaMarkup += '</span>';

		  element.innerHTML = schemaMarkup;
	}

	generateSchemaAddressMarkup() {
		const addressElement = document.createElement('div');

		addressElement.setAttribute('itemprop', 'address')
		addressElement.setAttribute('itemscope', '')
		addressElement.setAttribute('itemtype', "http://schema.org/PostalAddress")

		addressElement.style.display = 'none';
		addressElement.innerHTML = this.options.place_data.adr_address;

		addressElement.querySelector('.street-address').setAttribute('itemprop', 'streetAddress');
		addressElement.querySelector('.locality').setAttribute('itemprop', 'addressLocality');
		addressElement.querySelector('.region').setAttribute('itemprop', 'addressRegion');
		addressElement.querySelector('.postal-code').setAttribute('itemprop', 'postalCode');
		addressElement.querySelector('.country-name').setAttribute('itemprop', 'addressCountry');
		return addressElement.outerHTML;
	}

	generateSchemaRatingMarkup (placeData, schema) {
		var reviews = placeData.reviews;
		var lastIndex = reviews.length - 1;
		var reviewPointTotal = 0;

		for (var i = lastIndex; i >= 0; i--) {
		  reviewPointTotal += reviews[i].rating;
		};

		var averageReview = reviewPointTotal / ( reviews.length );

		return schema.beforeText + ' <span itemprop="name">' + placeData.name + '</span> '
		+  '<span itemprop="aggregateRating" itemscope="" itemtype="http://schema.org/AggregateRating">'
		+    '<span itemprop="ratingValue">' + averageReview.toFixed(2) + '</span>/<span itemprop="bestRating">5</span> '
		+  schema.middleText + ' <span itemprop="ratingCount">' + reviews.length + '</span> '
		+  schema.afterText
		+  '</span>'
	}

	generateSchemaItemMarkup (name, value) {
		return '<meta itemprop="' + name + '" content="' + value + '">'
	}
}
